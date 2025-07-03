// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BuilderCredit
 * @dev Smart contract for automated developer funding based on credit scores
 * Integrates with MetaMask Card and USDC for hackathon builders
 */
contract BuilderCredit is ReentrancyGuard, Ownable {
    IERC20 public immutable usdc;
    
    struct CreditProfile {
        uint256 creditScore;
        uint256 totalFunded;
        uint256 totalRepaid;
        uint256 activeLoanAmount;
        uint256 lastFundingTime;
        bool isActive;
    }
    
    struct Milestone {
        string description;
        uint256 reward;
        bool completed;
        uint256 completedAt;
    }
    
    struct Project {
        address developer;
        string githubUrl;
        string name;
        uint256 fundingAmount;
        uint256 fundedAt;
        Milestone[] milestones;
        bool isActive;
    }
    
    mapping(address => CreditProfile) public creditProfiles;
    mapping(bytes32 => Project) public projects;
    mapping(address => bytes32[]) public developerProjects;
    
    uint256 public constant MIN_CREDIT_SCORE = 400;
    uint256 public constant MAX_FUNDING_AMOUNT = 5000 * 10**6; // 5000 USDC
    uint256 public constant MIN_FUNDING_AMOUNT = 500 * 10**6;  // 500 USDC
    
    event FundingProvided(address indexed developer, uint256 amount, bytes32 projectId);
    event MilestoneCompleted(bytes32 indexed projectId, uint256 milestoneIndex, uint256 reward);
    event LoanRepaid(address indexed developer, uint256 amount);
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }
    
    /**
     * @dev Calculate funding amount based on credit score
     */
    function calculateFundingAmount(uint256 creditScore) public pure returns (uint256) {
        if (creditScore < MIN_CREDIT_SCORE) return 0;
        if (creditScore >= 800) return MAX_FUNDING_AMOUNT;
        
        // Linear scaling between min and max based on credit score
        uint256 range = MAX_FUNDING_AMOUNT - MIN_FUNDING_AMOUNT;
        uint256 scoreRange = 800 - MIN_CREDIT_SCORE;
        uint256 adjustedScore = creditScore - MIN_CREDIT_SCORE;
        
        return MIN_FUNDING_AMOUNT + (range * adjustedScore) / scoreRange;
    }
    
    /**
     * @dev Request funding for a project
     */
    function requestFunding(
        uint256 creditScore,
        string memory githubUrl,
        string memory projectName,
        string[] memory milestoneDescriptions,
        uint256[] memory milestoneRewards
    ) external nonReentrant {
        require(creditScore >= MIN_CREDIT_SCORE, "Credit score too low");
        require(milestoneDescriptions.length == milestoneRewards.length, "Milestone arrays mismatch");
        
        CreditProfile storage profile = creditProfiles[msg.sender];
        require(profile.activeLoanAmount == 0, "Active loan exists");
        
        uint256 fundingAmount = calculateFundingAmount(creditScore);
        require(usdc.balanceOf(address(this)) >= fundingAmount, "Insufficient contract balance");
        
        // Create project
        bytes32 projectId = keccak256(abi.encodePacked(msg.sender, githubUrl, block.timestamp));
        Project storage project = projects[projectId];
        project.developer = msg.sender;
        project.githubUrl = githubUrl;
        project.name = projectName;
        project.fundingAmount = fundingAmount;
        project.fundedAt = block.timestamp;
        project.isActive = true;
        
        // Add milestones
        for (uint i = 0; i < milestoneDescriptions.length; i++) {
            project.milestones.push(Milestone({
                description: milestoneDescriptions[i],
                reward: milestoneRewards[i],
                completed: false,
                completedAt: 0
            }));
        }
        
        // Update credit profile
        profile.creditScore = creditScore;
        profile.totalFunded += fundingAmount;
        profile.activeLoanAmount = fundingAmount;
        profile.lastFundingTime = block.timestamp;
        profile.isActive = true;
        
        developerProjects[msg.sender].push(projectId);
        
        // Transfer USDC
        require(usdc.transfer(msg.sender, fundingAmount), "USDC transfer failed");
        
        emit FundingProvided(msg.sender, fundingAmount, projectId);
    }
    
    /**
     * @dev Complete a milestone (called by oracle or admin)
     */
    function completeMilestone(bytes32 projectId, uint256 milestoneIndex) external onlyOwner {
        Project storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(milestoneIndex < project.milestones.length, "Invalid milestone index");
        require(!project.milestones[milestoneIndex].completed, "Milestone already completed");
        
        project.milestones[milestoneIndex].completed = true;
        project.milestones[milestoneIndex].completedAt = block.timestamp;
        
        uint256 reward = project.milestones[milestoneIndex].reward;
        if (reward > 0) {
            require(usdc.transfer(project.developer, reward), "Reward transfer failed");
        }
        
        emit MilestoneCompleted(projectId, milestoneIndex, reward);
    }
    
    /**
     * @dev Repay loan
     */
    function repayLoan(uint256 amount) external nonReentrant {
        CreditProfile storage profile = creditProfiles[msg.sender];
        require(profile.activeLoanAmount > 0, "No active loan");
        require(amount <= profile.activeLoanAmount, "Amount exceeds loan");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        profile.activeLoanAmount -= amount;
        profile.totalRepaid += amount;
        
        emit LoanRepaid(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "Transfer failed");
    }
    
    /**
     * @dev Fund the contract with USDC
     */
    function fundContract(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
}
