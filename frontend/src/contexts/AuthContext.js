import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState([]);

  // Check for pending permissions based on GitHub username
  const checkPendingPermissions = async (user) => {
    try {
      // Get the GitHub username from the provider data
      const githubUsername = user.providerData.find(
        (p) => p.providerId === "github.com"
      )?.uid;

      if (!githubUsername) {
        return;
      }

      // Query the pendingPermissions collection for this GitHub username
      const pendingPermissionsRef = collection(db, "pendingPermissions");
      const q = query(
        pendingPermissionsRef,
        where("githubUsername", "==", githubUsername)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }


      // Process each pending permission
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      const currentPermissions = userData.permissions || [];
      let newPermissions = [...currentPermissions];

      for (const permissionDoc of querySnapshot.docs) {
        const permissionData = permissionDoc.data();

        // Add to user's permissions if not already there
        if (
          !newPermissions.some(
            (p) => p.projectSlug === permissionData.projectSlug
          )
        ) {
          newPermissions.push({
            projectSlug: permissionData.projectSlug,
            projectName: permissionData.projectName,
            role: permissionData.role,
            grantedAt: permissionData.grantedAt,
          });

          // Add user to project owners
          const projectRef = doc(db, "projects", permissionData.projectSlug);
          const projectDoc = await getDoc(projectRef);

          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const owners = projectData.owners || [];

            if (!owners.includes(user.uid)) {
              owners.push(user.uid);
              await setDoc(projectRef, { owners }, { merge: true });
            }
          }

          // Delete the pending permission
          await deleteDoc(permissionDoc.ref);
        }
      }

      // Update user permissions if changed
      if (newPermissions.length !== currentPermissions.length) {
        await setDoc(
          userDocRef,
          { permissions: newPermissions },
          { merge: true }
        );
        setUserPermissions(newPermissions);
      }
    } catch (error) {
      console.error("Error checking pending permissions:", error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user permissions from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserPermissions(userDoc.data().permissions || []);
            
            // Store provider data if not already stored
            if (!userDoc.data().providerData) {
              await setDoc(userDocRef, {
                providerData: user.providerData
              }, { merge: true });
            }
            
            // Check for pending permissions
            await checkPendingPermissions(user);
          } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              githubUsername: user.providerData[0]?.uid || "",
              providerData: user.providerData,
              permissions: [],
            });
            setUserPermissions([]);
            
            // Check for pending permissions
            await checkPendingPermissions(user);
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
        }
      } else {
        setUserPermissions([]);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider();
      provider.addScope("repo"); // Request repo access to verify ownership
      const result = await signInWithPopup(auth, provider);

      // This gives you a GitHub Access Token
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;

      // Store the encrypted token for later use (e.g., to verify repo ownership)
      if (result.user) {
        const { encryptData } = await import('@/utils/encryption');
        const encryptedToken = token ? encryptData(token) : null;
        
        const userDocRef = doc(db, "users", result.user.uid);
        await setDoc(
          userDocRef,
          {
            githubToken: encryptedToken,
            githubUsername: result.user.providerData[0]?.uid || "",
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            lastLogin: new Date().toISOString(),
            // Don't store full providerData as it may contain sensitive info
          },
          { merge: true }
        );

        // Check for pending permissions
        await checkPendingPermissions(result.user);
      }

      return result;
    } catch (error) {
      console.error("Error signing in with GitHub:", error);
      throw error;
    }
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Check if user has permission to edit a project
  const hasProjectPermission = (projectSlug) => {
    return userPermissions.some(p => p.projectSlug === projectSlug && p.role === 'editor');
  };

  const value = {
    currentUser,
    userPermissions,
    loading,
    signInWithGithub,
    logout,
    hasProjectPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
