import { useState, useEffect } from "react";
import useSWR from "swr";

/**
 * Custom hook to fetch social media data
 * @param {Object} socialLinks - Object containing social media links
 * @returns {Object} Social media data and loading state
 */
export function useSocialData(socialLinks) {
  const { data, error, isLoading } = useSWR(
    socialLinks ? `social-${JSON.stringify(socialLinks)}` : null,
    () => fetchSocialData(socialLinks),
    {
      revalidateOnFocus: false,
      refreshInterval: 3600000, // Refresh every hour
    }
  );

  return {
    socialData: data,
    isLoading,
    isError: !!error,
  };
}

/**
 * Fetch social media data from various platforms
 * @param {Object} socialLinks - Object containing social media links
 * @returns {Promise<Object>} Social media data
 */
import { socialProtocolService } from "../services/SocialProtocolService";

async function fetchSocialData(socialLinks) {
  if (!socialLinks) return {};

  const result = {
    twitter: { followers: null, verified: false },
    discord: { members: null },
    farcaster: { followers: null, profile: null },
    lens: { followers: null, profile: null },
  };

  if (socialLinks.farcaster) {
    const farcasterProfile = await socialProtocolService.getFarcasterProfile(
      socialLinks.farcaster
    );
    if (farcasterProfile) {
      result.farcaster = {
        followers: farcasterProfile.followerCount,
        profile: farcasterProfile,
      };
    }
  }

  if (socialLinks.lens) {
    const lensProfile = await socialProtocolService.getLensProfile(
      socialLinks.lens
    );
    if (lensProfile) {
      result.lens = {
        followers: lensProfile.stats.followers,
        profile: lensProfile,
      };
    }
  }

  // Twitter and Discord would be implemented here with their respective services
  // For now, they will remain as placeholders

  if (socialLinks.twitter) {
    result.twitter = {
      followers: Math.floor(Math.random() * 10000),
      verified: Math.random() > 0.5,
    };
  }

  if (socialLinks.discord) {
    result.discord = {
      members: Math.floor(Math.random() * 5000),
    };
  }

  return result;
}
