/**
 * Hook for fetching War Room data
 * Aggregates hackathons, pending milestones, and hackathon group progress
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useUser } from '@/contexts/UserContext';
import { useBuilderCredit } from '@/contexts/WalletContext';
import { realGitHubService } from '@/services/RealGitHubService';

export function useWarRoomData() {
  const { currentUser } = useUser();
  const { hackathonRegistryContract, coreContract, account } = useBuilderCredit();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedHackathons, setAssignedHackathons] = useState([]);
  const [pendingMilestones, setPendingMilestones] = useState([]);
  const [hackathonGroups, setHackathonGroups] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const fetchData = useCallback(async () => {
    // If we're not connected or no contract, we can't do much
    if (!currentUser || !hackathonRegistryContract || !account) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all hackathons from Firestore
      const hackathonsRef = collection(db, 'hackathons');
      const hackathonsSnapshot = await getDocs(hackathonsRef);
      const allHackathons = hackathonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Filter hackathons where user is a verifier on-chain
      const verifierStatusPromises = allHackathons.map(async (h) => {
        try {
          // Assume h.id (Firestore ID) might be different from onChainId if it exists
          let onChainId = h.onChainId;
          if (onChainId === undefined) {
             // Try to find by name if onChainId is not in Firestore
             try {
                onChainId = await hackathonRegistryContract.getHackathonIdByName(h.name);
             } catch (e) {
                return { ...h, isVerifier: false };
             }
          }
          
          const isVerifier = await hackathonRegistryContract.isVerifier(onChainId, account);
          
          // Get additional details like required signatures
          let requiredSignatures = 1;
          if (isVerifier) {
            requiredSignatures = await hackathonRegistryContract.getRequiredSignatures(onChainId);
          }

          return { ...h, onChainId, isVerifier, requiredSignatures };
        } catch (err) {
          console.warn(`Failed to check verifier status for hackathon ${h.name}:`, err);
          return { ...h, isVerifier: false };
        }
      });

      const hackathonsWithVerifierStatus = await Promise.all(verifierStatusPromises);
      const userHackathons = hackathonsWithVerifierStatus.filter(h => h.isVerifier);
      setAssignedHackathons(userHackathons);

      if (userHackathons.length > 0) {
        const hackathonOnChainIds = userHackathons.map(h => h.onChainId);
        
        // 3. Fetch Projects for these hackathons
        // In this platform, projects are linked to hackathons in the BuilderCreditCore contract
        // But for discovery, they should also be in Firestore.
        const projectsRef = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsRef);
        const allProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter projects that are part of the verifier's hackathons
        const userProjects = allProjects.filter(p => 
          p.hackathons && p.hackathons.some(hId => 
            hackathonOnChainIds.some(onChainId => onChainId.toString() === hId.toString())
          )
        );

        // 4. Fetch Milestones for these projects from the contract
        const milestonePromises = userProjects.map(async (project) => {
          try {
            // Need to get projectId from on-chain. Assuming project.onChainId or we use project.id if they match
            const onChainProjectId = project.onChainId || project.id;
            const milestones = await coreContract.getProjectMilestones(onChainProjectId);
            
            return milestones.map((m, index) => ({
              ...m,
              projectId: project.id,
              onChainProjectId,
              projectName: project.name,
              milestoneId: index,
              description: m.description,
              amount: m.amount,
              completed: m.completed,
              githubUrl: project.githubUrl,
              repo: project.repo,
              owner: project.owner
            }));
          } catch (err) {
            console.error(`Failed to fetch milestones for project ${project.name}:`, err);
            return [];
          }
        });

        const allProjectMilestones = (await Promise.all(milestonePromises)).flat();
        
        // Filter only pending milestones and check if current user already approved
        const pendingMilestonesPromises = allProjectMilestones
          .filter(m => !m.completed)
          .map(async (m) => {
            const [hasApproved, approvalCount, isCompleted] = await coreContract.getMilestoneApprovalStatus(
              m.onChainProjectId, 
              m.milestoneId, 
              account
            );
            
            // Find which hackathons this project belongs to that the user is a verifier for
            const projectHackathons = userHackathons.filter(h => 
              allProjects.find(p => p.id === m.projectId)?.hackathons?.some(hId => hId.toString() === h.onChainId.toString())
            );

            return {
              ...m,
              hasApproved,
              approvalCount: Number(approvalCount),
              isCompleted,
              assignedHackathons: projectHackathons
            };
          });

        const pendingWithStatus = await Promise.all(pendingMilestonesPromises);
        setPendingMilestones(pendingWithStatus);

        // 5. Fetch Evidence (GitHub PRs)
        if (realGitHubService.isConfigured()) {
          const evidencePromises = userProjects.map(async (p) => {
            try {
              const prs = await realGitHubService.getRepoPullRequests(p.owner, p.repo);
              return prs.map(pr => ({
                type: 'pr',
                title: pr.title,
                description: pr.body || 'No description provided',
                project: p.name,
                timestamp: new Date(pr.created_at).toLocaleDateString(),
                url: pr.html_url
              }));
            } catch (err) {
              console.warn(`Failed to fetch PRs for ${p.name}:`, err);
              return [];
            }
          });
          const allEvidence = (await Promise.all(evidencePromises)).flat();
          // Sort by timestamp (descending) - simplified
          setEvidence(allEvidence.slice(0, 10));
        }

        // 6. Fetch hackathon groups
        // Aggregates hackathons grouped by expeditionId for verifier assignment tracking
        const hackathonGroupsRef = collection(db, 'expeditions');
        const hackathonGroupsSnapshot = await getDocs(hackathonGroupsRef);
        const allGroups = hackathonGroupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Map hackathons to groups
        const groupsWithHackathons = allGroups.map(group => {
          const groupHackathons = allHackathons.filter(h => h.expeditionId === group.id);
          const progress = groupHackathons.length > 0 
            ? (groupHackathons.filter(h => h.status === 'completed').length / groupHackathons.length) * 100
            : 0;
          
          return {
            ...group,
            hackathons: groupHackathons,
            progress
          };
        }).filter(group => group.hackathons.some(h => userHackathons.some(uh => uh.id === h.id)));
        
        setHackathonGroups(groupsWithHackathons);
      } else {
        setPendingMilestones([]);
        setHackathonGroups([]);
      }

    } catch (err) {
      console.error('Error fetching War Room data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, hackathonRegistryContract, coreContract, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    assignedHackathons,
    pendingMilestones,
    hackathonGroups,
    evidence,
    refresh: fetchData,
  };
}
