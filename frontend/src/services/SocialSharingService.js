/**
 * Social Sharing Service
 * Handles automated sharing to Farcaster when new projects are created or milestones are verified.
 */

class SocialSharingService {
  constructor() {
    this.snapServerUrl = process.env.NEXT_PUBLIC_SNAP_SERVER_URL || 'https://snap-server.proofofship.xyz';
    this.neynarApiKey = process.env.NEYNAR_API_KEY;
  }

  /**
   * Share a new project to Farcaster
   * @param {Object} projectData - The project data
   */
  async shareNewProject(projectData) {
    try {
      const { slug, name, description } = projectData;
      const snapUrl = `${this.snapServerUrl}/snaps/scout/${slug}`;
      const castText = `🚢 New project on Proof of Ship: ${name}!\n\n${description}\n\nScout this project and back its milestones:`;

      await this.castToFarcaster(castText, [snapUrl]);
    } catch (error) {
      console.error('Error sharing new project:', error);
    }
  }

  /**
   * Share a verified milestone to Farcaster
   * @param {string} projectSlug - The project slug
   * @param {Object} milestoneData - The milestone data
   * @param {number} userFid - Optional user FID to notify via push
   */
  async shareVerifiedMilestone(projectSlug, milestoneData, userFid = null) {
    try {
      const snapUrl = `${this.snapServerUrl}/snaps/scout/${projectSlug}`;
      const castText = `✅ Milestone verified for project ${projectSlug}!\n\nMilestone: ${milestoneData.title}\n\nCheck out the progress and scout more projects:`;

      await this.castToFarcaster(castText, [snapUrl]);

      if (userFid) {
        await this.sendPushNotification(userFid, 'Milestone Verified!', `Your milestone "${milestoneData.title}" for ${projectSlug} has been verified.`);
      }
    } catch (error) {
      console.error('Error sharing verified milestone:', error);
    }
  }

  /**
   * Send a push notification via Hypersnap (through our Snap Server)
   * @param {number} fid - Farcaster FID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   */
  async sendPushNotification(fid, title, body) {
    try {
      await fetch(`${this.snapServerUrl}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fid, title, body }),
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Cast a message to Farcaster using Neynar API
   * @param {string} text - The cast text
   * @param {Array<string>} embeds - Array of embed URLs
   */
  async castToFarcaster(text, embeds = []) {
    // In a real environment, this would call Neynar or our snap server
    // For now, we'll log it and attempt a fetch if the API key is present
    console.log(`Casting to Farcaster: "${text}" with embeds: ${embeds.join(', ')}`);

    if (!this.neynarApiKey) {
      console.warn('Neynar API key missing, skipping actual cast');
      return;
    }

    try {
      const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': this.neynarApiKey,
        },
        body: JSON.stringify({
          text,
          embeds: embeds.map(url => ({ url })),
          signer_uuid: process.env.NEYNAR_SIGNER_UUID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Neynar API error: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to cast to Farcaster:', error);
    }
  }
}

export const socialSharingService = new SocialSharingService();
export default socialSharingService;
