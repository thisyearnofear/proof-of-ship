// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BuilderCreditStorage
 * @dev Storage contract for BuilderCredit
 * Contains all data structures and storage variables
 */
contract BuilderCreditStorage {
    // Constants
    uint256 public constant MIN_CREDIT_SCORE = 400;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    uint256 public constant MAX_FUNDING_AMOUNT = 5000 * 10**6; // 5000 USDC
    uint256 public constant MIN_FUNDING_AMOUNT = 500 * 10**6;  // 500 USDC
    uint256 public constant TIMELOCK_DURATION = 2 days;        // Timelock duration for critical operations
    uint256 public constant MILESTONE_CONFIRMATIONS = 2;       // Required confirmations for milestone completion
    uint256 public constant MAX_MILESTONES = 10;               // Maximum number of milestones per project
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    // Struct definitions
    struct CreditProfile {
        uint256 creditScore;          // Developer's credit score (400-850)
        uint256 totalFunded;          // Total amount funded to this developer
        uint256 totalRepaid;          // Total amount repaid by this developer
        uint256 activeLoanAmount;     // Current outstanding loan amount
        uint256 lastFundingTime;      // Timestamp of last funding
        uint256 reputation;           // On-chain reputation score
        bool isActive;                // Whether this profile is active
    }
    
    struct Milestone {
        string description;           // Description of the milestone
        uint256 reward;               // Reward amount for completing this milestone
        uint256 confirmations;        // Number of oracle confirmations received
        address[] confirmedBy;        // Addresses that confirmed this milestone
        bool completed;               // Whether this milestone is completed
        uint256 completedAt;          // Timestamp when milestone was completed
    }
    
    struct Project {
        address developer;            // Address of the project developer
        string githubUrl;             // GitHub URL of the project
        string name;                  // Name of the project
        uint256 fundingAmount;        // Amount of funding provided
        uint256 fundedAt;             // Timestamp when funding was provided
        Milestone[] milestones;       // Array of project milestones
        bool isActive;                // Whether this project is active
    }
    
    // Timelock operation
    struct TimelockOperation {
        bytes32 operationId;          // Unique ID of the operation
        address proposer;             // Address that proposed the operation
        uint256 proposedAt;           // Timestamp when operation was proposed
        uint256 executeAfter;         // Timestamp after which operation can be executed
        bool executed;                // Whether operation has been executed
        bytes data;                   // Operation data
    }
    
    // State variables
    mapping(address => CreditProfile) internal _creditProfiles;
    mapping(bytes32 => Project) internal _projects;
    mapping(address => bytes32[]) internal _developerProjects;
    mapping(bytes32 => TimelockOperation) internal _timelockOperations;
    mapping(address => mapping(bytes32 => bool)) internal _projectVerifiers;
}