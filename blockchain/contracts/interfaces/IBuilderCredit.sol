// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IBuilderCredit
 * @dev Interface for the BuilderCredit contract
 */
interface IBuilderCredit {
    // Events
    event FundingProvided(address indexed developer, uint256 amount, bytes32 projectId);
    event MilestoneConfirmed(bytes32 indexed projectId, uint256 milestoneIndex, address confirmedBy);
    event MilestoneCompleted(bytes32 indexed projectId, uint256 milestoneIndex, uint256 reward);
    event LoanRepaid(address indexed developer, uint256 amount);
    event ProjectRegistered(bytes32 indexed projectId, address indexed developer, string githubUrl);
    event OperationProposed(bytes32 indexed operationId, address proposer, uint256 executeAfter);
    event OperationExecuted(bytes32 indexed operationId, address executor);
    event OperationCancelled(bytes32 indexed operationId, address canceller);
    event ReputationUpdated(address indexed developer, uint256 oldReputation, uint256 newReputation);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);
    event ContractFunded(address indexed funder, uint256 amount);

    // Main functions
    function calculateFundingAmount(uint256 creditScore) external pure returns (uint256);
    
    function requestFunding(
        uint256 creditScore,
        string memory githubUrl,
        string memory projectName,
        string[] memory milestoneDescriptions,
        uint256[] memory milestoneRewards
    ) external;
    
    function confirmMilestone(bytes32 projectId, uint256 milestoneIndex) external;
    
    function repayLoan(uint256 amount) external;
    
    function fundContract(uint256 amount) external;
    
    // View functions
    function getDeveloperProjects(address developer) external view returns (bytes32[] memory);
    
    function getMilestoneDetails(bytes32 projectId, uint256 milestoneIndex) 
        external 
        view 
        returns (
            string memory description,
            uint256 reward,
            uint256 confirmations,
            bool completed,
            uint256 completedAt
        );
    
    function getMilestoneVerifiers(bytes32 projectId, uint256 milestoneIndex) 
        external 
        view 
        returns (address[] memory);
        
    // Admin functions
    function pause() external;
    
    function unpause() external;
    
    function addOracle(address oracle) external;
    
    function removeOracle(address oracle) external;
    
    function proposeEmergencyWithdrawal(address recipient, uint256 amount) external returns (bytes32);
    
    function executeEmergencyWithdrawal(bytes32 operationId) external;
    
    function cancelTimelockOperation(bytes32 operationId) external;
    
    function setReputation(address developer, uint256 reputation) external;
}