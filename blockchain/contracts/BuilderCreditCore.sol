// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IHackathonRegistry.sol";

/**
 * @title BuilderCreditCore
 * @dev Core contract for the Builder Credit platform
 * Manages credit lines, projects, milestones, and funding
 */
contract BuilderCreditCore is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    
    // Counters
    Counters.Counter private _projectIdCounter;
    
    // External contract interfaces
    IHackathonRegistry public registry;
    IERC20 public usdcToken;
    
    // Credit parameters
    uint256 public baseCreditAmount = 100 * 1e6; // 100 USDC base credit
    uint256 public creditMultiplier = 10 * 1e6;  // 10 USDC per credit score point
    uint256 public maxCreditAmount = 10000 * 1e6; // 10,000 USDC maximum credit
    
    // Structures
    struct Project {
        uint256 hackathonId;
        address developer;
        string githubUrl;
        string name;
        uint256 fundingAmount;
        bool isActive;
        uint256 fundedAt;
        uint256 creditScore;
        uint256 milestonesCompleted;
        uint256 milestonesCount;
    }
    
    struct Milestone {
        string description;
        uint256 amount;
        bool completed;
        uint256 completedAt;
    }
    
    struct MilestoneApproval {
        mapping(address => bool) hasApproved;
        uint8 approvalCount;
        bool isCompleted;
    }
    
    struct CreditLine {
        uint256 totalAmount;
        uint256 usedAmount;
        uint256 reputation;
        bool active;
        uint256 lastUpdated;
    }
    
    // Storage
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Milestone[]) public projectMilestones;
    mapping(uint256 => mapping(uint256 => MilestoneApproval)) public approvals;
    mapping(address => uint256[]) public developerProjects;
    mapping(address => CreditLine) public creditLines;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId, 
        uint256 indexed hackathonId, 
        address indexed developer, 
        uint256 amount,
        string name
    );
    
    event MilestoneCompleted(
        uint256 indexed projectId, 
        uint256 indexed milestoneId, 
        uint256 amount,
        address indexed developer
    );
    
    event MilestoneApproved(
        uint256 indexed projectId, 
        uint256 indexed milestoneId, 
        address indexed verifier
    );
    
    event CreditLineUpdated(
        address indexed developer, 
        uint256 totalAmount, 
        uint256 usedAmount, 
        uint256 reputation
    );
    
    event FundsWithdrawn(address token, address to, uint256 amount);
    event CreditParametersUpdated(uint256 base, uint256 multiplier, uint256 max);
    
    /**
     * @dev Constructor
     * @param _registry Address of the HackathonRegistry contract
     * @param _usdcToken Address of the USDC token contract
     */
    constructor(address _registry, address _usdcToken) {
        require(_registry != address(0), "Invalid registry address");
        require(_usdcToken != address(0), "Invalid token address");
        
        registry = IHackathonRegistry(_registry);
        usdcToken = IERC20(_usdcToken);
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PLATFORM_ADMIN_ROLE, msg.sender);
        _setupRole(TREASURY_ROLE, msg.sender);
    }
    
    /**
     * @dev Requests funding for a project
     * @param hackathonId ID of the hackathon
     * @param creditScore Credit score of the developer
     * @param githubUrl GitHub URL of the project
     * @param projectName Name of the project
     * @param milestoneDescriptions Array of milestone descriptions
     * @param milestoneAmounts Array of milestone amounts
     * @return projectId ID of the created project
     */
    function requestFunding(
        uint256 hackathonId,
        uint256 creditScore,
        string calldata githubUrl,
        string calldata projectName,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmounts
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        require(bytes(githubUrl).length > 0, "GitHub URL cannot be empty");
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(milestoneDescriptions.length == milestoneAmounts.length, "Mismatched milestone arrays");
        require(milestoneDescriptions.length > 0, "No milestones provided");
        
        // Calculate total funding amount
        uint256 totalAmount = 0;
        for (uint i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "Milestone amount must be greater than 0");
            totalAmount += milestoneAmounts[i];
        }
        
        // Calculate max funding based on credit score
        uint256 maxFunding = calculateFundingAmount(creditScore);
        require(totalAmount <= maxFunding, "Requested amount exceeds credit limit");
        
        // Update or create credit line
        _updateCreditLine(msg.sender, creditScore, totalAmount);
        
        // Create new project
        _projectIdCounter.increment();
        uint256 projectId = _projectIdCounter.current();
        
        projects[projectId] = Project({
            hackathonId: hackathonId,
            developer: msg.sender,
            githubUrl: githubUrl,
            name: projectName,
            fundingAmount: totalAmount,
            isActive: true,
            fundedAt: block.timestamp,
            creditScore: creditScore,
            milestonesCompleted: 0,
            milestonesCount: milestoneDescriptions.length
        });
        
        // Add milestones
        for (uint i = 0; i < milestoneDescriptions.length; i++) {
            projectMilestones[projectId].push(Milestone({
                description: milestoneDescriptions[i],
                amount: milestoneAmounts[i],
                completed: false,
                completedAt: 0
            }));
        }
        
        // Track project for this developer
        developerProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(projectId, hackathonId, msg.sender, totalAmount, projectName);
        
        return projectId;
    }
    
    /**
     * @dev Approves a milestone for a project
     * @param projectId ID of the project
     * @param milestoneId ID of the milestone
     */
    function approveMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Project storage project = projects[projectId];
        require(project.isActive, "Project is not active");
        
        uint256 hackathonId = project.hackathonId;
        
        // Verify the caller is an authorized verifier for this hackathon
        require(registry.isVerifier(hackathonId, msg.sender), "Not an authorized verifier");
        
        // Get milestone
        require(milestoneId < projectMilestones[projectId].length, "Invalid milestone ID");
        Milestone storage milestone = projectMilestones[projectId][milestoneId];
        require(!milestone.completed, "Milestone already completed");
        
        // Update approval status
        MilestoneApproval storage approval = approvals[projectId][milestoneId];
        require(!approval.hasApproved[msg.sender], "Already approved by this verifier");
        
        approval.hasApproved[msg.sender] = true;
        approval.approvalCount++;
        
        emit MilestoneApproved(projectId, milestoneId, msg.sender);
        
        // Check if threshold reached
        if (approval.approvalCount >= registry.getRequiredSignatures(hackathonId)) {
            _completeMilestone(projectId, milestoneId);
        }
    }
    
    /**
     * @dev Internal function to complete a milestone
     * @param projectId ID of the project
     * @param milestoneId ID of the milestone
     */
    function _completeMilestone(uint256 projectId, uint256 milestoneId) internal {
        Milestone storage milestone = projectMilestones[projectId][milestoneId];
        milestone.completed = true;
        milestone.completedAt = block.timestamp;
        
        // Mark as completed in approval tracking
        approvals[projectId][milestoneId].isCompleted = true;
        
        // Update project milestone counter
        Project storage project = projects[projectId];
        project.milestonesCompleted++;
        
        // If all milestones are completed, mark project as inactive
        if (project.milestonesCompleted == project.milestonesCount) {
            project.isActive = false;
        }
        
        // Transfer the milestone amount to the developer
        usdcToken.safeTransfer(project.developer, milestone.amount);
        
        // Update developer's reputation
        CreditLine storage creditLine = creditLines[project.developer];
        creditLine.reputation += 1; // Increment reputation for each completed milestone
        creditLine.lastUpdated = block.timestamp;
        
        emit MilestoneCompleted(projectId, milestoneId, milestone.amount, project.developer);
    }
    
    /**
     * @dev Updates a developer's credit line
     * @param developer Address of the developer
     * @param creditScore Credit score of the developer
     * @param requestedAmount Amount requested for funding
     */
    function _updateCreditLine(
        address developer, 
        uint256 creditScore,
        uint256 requestedAmount
    ) 
        internal 
    {
        CreditLine storage creditLine = creditLines[developer];
        
        if (creditLine.lastUpdated == 0) {
            // New credit line
            creditLine.totalAmount = calculateFundingAmount(creditScore);
            creditLine.usedAmount = requestedAmount;
            creditLine.reputation = creditScore;
            creditLine.active = true;
            creditLine.lastUpdated = block.timestamp;
        } else {
            // Update existing credit line
            creditLine.usedAmount += requestedAmount;
            
            // If their reputation has improved, increase their credit line
            if (creditScore > creditLine.reputation) {
                creditLine.totalAmount = calculateFundingAmount(creditScore);
                creditLine.reputation = creditScore;
            }
            
            creditLine.lastUpdated = block.timestamp;
        }
        
        emit CreditLineUpdated(
            developer, 
            creditLine.totalAmount, 
            creditLine.usedAmount, 
            creditLine.reputation
        );
    }
    
    /**
     * @dev Calculates funding amount based on credit score
     * @param creditScore Credit score of the developer
     * @return amount Calculated funding amount
     */
    function calculateFundingAmount(uint256 creditScore) public view returns (uint256) {
        // Base amount + (creditScore * multiplier)
        uint256 amount = baseCreditAmount + (creditScore * creditMultiplier);
        
        // Cap at maximum amount
        return amount > maxCreditAmount ? maxCreditAmount : amount;
    }
    
    /**
     * @dev Updates credit calculation parameters
     * @param _baseCreditAmount Base credit amount
     * @param _creditMultiplier Credit multiplier
     * @param _maxCreditAmount Maximum credit amount
     */
    function updateCreditParameters(
        uint256 _baseCreditAmount,
        uint256 _creditMultiplier,
        uint256 _maxCreditAmount
    ) 
        external 
        onlyRole(PLATFORM_ADMIN_ROLE) 
    {
        baseCreditAmount = _baseCreditAmount;
        creditMultiplier = _creditMultiplier;
        maxCreditAmount = _maxCreditAmount;
        
        emit CreditParametersUpdated(_baseCreditAmount, _creditMultiplier, _maxCreditAmount);
    }
    
    /**
     * @dev Withdraws funds from the contract
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawFunds(address token, uint256 amount) 
        external 
        onlyRole(TREASURY_ROLE) 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        tokenContract.safeTransfer(msg.sender, amount);
        
        emit FundsWithdrawn(token, msg.sender, amount);
    }
    
    /**
     * @dev Gets all milestones for a project
     * @param projectId ID of the project
     * @return Array of milestones
     */
    function getProjectMilestones(uint256 projectId) 
        external 
        view 
        returns (Milestone[] memory) 
    {
        return projectMilestones[projectId];
    }
    
    /**
     * @dev Gets all projects for a developer
     * @param developer Address of the developer
     * @return Array of project IDs
     */
    function getDeveloperProjects(address developer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return developerProjects[developer];
    }
    
    /**
     * @dev Gets approval status for a milestone
     * @param projectId ID of the project
     * @param milestoneId ID of the milestone
     * @param verifier Address of the verifier
     * @return hasApproved Whether the verifier has approved the milestone
     * @return approvalCount Number of approvals
     * @return isCompleted Whether the milestone is completed
     */
    function getMilestoneApprovalStatus(
        uint256 projectId,
        uint256 milestoneId,
        address verifier
    ) 
        external 
        view 
        returns (bool hasApproved, uint8 approvalCount, bool isCompleted) 
    {
        MilestoneApproval storage approval = approvals[projectId][milestoneId];
        return (
            approval.hasApproved[verifier],
            approval.approvalCount,
            approval.isCompleted
        );
    }
    
    /**
     * @dev Pauses the contract
     * Only callable by platform admin
     */
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract
     * Only callable by platform admin
     */
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Updates the registry address
     * @param _registry New registry address
     */
    function updateRegistry(address _registry) 
        external 
        onlyRole(PLATFORM_ADMIN_ROLE) 
    {
        require(_registry != address(0), "Invalid registry address");
        registry = IHackathonRegistry(_registry);
    }
    
    /**
     * @dev Updates the USDC token address
     * @param _usdcToken New USDC token address
     */
    function updateUsdcToken(address _usdcToken) 
        external 
        onlyRole(PLATFORM_ADMIN_ROLE) 
    {
        require(_usdcToken != address(0), "Invalid token address");
        usdcToken = IERC20(_usdcToken);
    }
}