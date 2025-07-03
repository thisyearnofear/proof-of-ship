// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IHackathonRegistry
 * @dev Interface for the HackathonRegistry contract
 * Provides functions for verifying hackathon verifiers and signature requirements
 */
interface IHackathonRegistry {
    /**
     * @dev Checks if an address is an authorized verifier for a hackathon
     * @param hackathonId ID of the hackathon
     * @param verifier Address to check
     * @return bool True if the address is a verifier, false otherwise
     */
    function isVerifier(uint256 hackathonId, address verifier) external view returns (bool);
    
    /**
     * @dev Gets the number of required signatures for a hackathon's milestone verification
     * @param hackathonId ID of the hackathon
     * @return uint256 The number of required signatures
     */
    function getRequiredSignatures(uint256 hackathonId) external view returns (uint256);
    
    /**
     * @dev Gets hackathon details by ID
     * @param hackathonId ID of the hackathon
     * @return name The name of the hackathon
     * @return organizer The address of the hackathon organizer
     * @return startDate The start date of the hackathon
     * @return endDate The end date of the hackathon
     * @return isActive Whether the hackathon is active
     */
    function getHackathonDetails(uint256 hackathonId) external view returns (
        string memory name,
        address organizer,
        uint256 startDate,
        uint256 endDate,
        bool isActive
    );
    
    /**
     * @dev Gets all verifiers for a hackathon
     * @param hackathonId ID of the hackathon
     * @return Array of verifier addresses
     */
    function getHackathonVerifiers(uint256 hackathonId) external view returns (address[] memory);
}