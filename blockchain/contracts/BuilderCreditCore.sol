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
    bytes32 public constant SCORER_ROLE = keccak256("SCORER_ROLE");
    
    // Counters
    Counters.Counter private _projectIdCounter;
    
    // External contract interfaces
    IHackathonRegistry public registry;
    IERC20 public usdcToken;
    
    // Credit parameters
    uint256 public constant MIN_CREDIT_SCORE = 400;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    uint256 public baseCreditAmount = 500 * 1e6; // 500 USDC minimum funding at baseline score
    uint256 public creditMultiplier = 10 * 1e6;  // Legacy multiplier placeholder
    uint256 public maxCreditAmount = 5000 * 1e6; // 5,000 USDC maximum funding
    
    // Structures
    struct Project {
        uint256[] hackathonIds;
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
    
    struct Backing {
        address backer;
        uint256 amount;
        uint256 multiplier; // 150, 200, 300 for 1.5x, 2x, 3x
        bool claimed;
    }
    
    struct Milestone {
        string description;
        uint256 amount;
        bool completed;
        uint256 completedAt;
    }

    struct CheckIn {
        uint256 timestamp;
        string metadata; // e.g., "Updated UI", "Fixed bug", or a link to a demo
    }
    
    struct TeamMember {
        address member;
        uint256 share; // in basis points, e.g., 5000 = 50%
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
    mapping(uint256 => Backing[]) public projectBackings;
    mapping(uint256 => CheckIn[]) public projectCheckIns;
    mapping(uint256 => uint256) public totalProjectBacking;
    mapping(uint256 => uint256) public projectPledgedPrize;
    mapping(uint256 => Milestone[]) public projectMilestones;
    mapping(uint256 => TeamMember[]) public projectTeams;
    mapping(uint256 => mapping(uint256 => MilestoneApproval)) public approvals;
    mapping(address => uint256[]) public developerProjects;
    mapping(address => uint256[]) public backerProjects;
    mapping(address => CreditLine) public creditLines;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId, 
        uint256[] hackathonIds, 
        address indexed developer, 
        uint256 amount,
        string name
    );

    event ProjectBacked(
        uint256 indexed projectId, 
        address indexed backer, 
        uint256 amount, 
        uint256 multiplier
    );

    event CheckInPosted(
        uint256 indexed projectId,
        uint256 timestamp,
        string metadata
    );

    event PrizePledged(
        uint256 indexed projectId, 
        uint256 amount
    );

    event PrizeDistributed(
        uint256 indexed projectId, 
        uint256 totalAmount, 
        uint256 backerPayout, 
        uint256 builderPayout
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
    
    event ReputationUpdated(address indexed developer, uint256 oldReputation, uint256 newReputation);
    event LoanRepaid(address indexed developer, uint256 amount);
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
        _setupRole(SCORER_ROLE, msg.sender);
    }
    
    /**
     * @dev Initializer for cloned instances
     * @param _usdc Address of the USDC token contract
     * @param _admin Address of the admin
     * @param _oracles Array of oracle addresses
     */
    function initialize(
        address _usdc,
        address _admin,
        address[] calldata _oracles
    ) external {
        // Only allow initialization if not already initialized
        require(address(usdcToken) == address(0), "Already initialized");
        require(_usdc != address(0), "Invalid token address");
        require(_admin != address(0), "Invalid admin address");

        usdcToken = IERC20(_usdc);
        
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(PLATFORM_ADMIN_ROLE, _admin);
        _setupRole(TREASURY_ROLE, _admin);
        _setupRole(SCORER_ROLE, _admin);

        for (uint256 i = 0; i < _oracles.length; i++) {
            _setupRole(SCORER_ROLE, _oracles[i]);
        }
    }

    /**
     * @dev Repays a loan for a developer
     * @param amount Amount of USDC to repay
     */
    function repayLoan(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        CreditLine storage creditLine = creditLines[msg.sender];
        require(creditLine.active, "No active credit line");
        require(amount <= creditLine.usedAmount, "Repayment exceeds used amount");

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 oldReputation = creditLine.reputation;
        creditLine.usedAmount -= amount;
        
        // Reputation incentive: +1 rep for every 100 USDC repaid (rounded down)
        uint256 repGain = amount / 100e6; 
        if (repGain > 0) {
            creditLine.reputation += repGain;
            if (creditLine.reputation > MAX_CREDIT_SCORE) {
                creditLine.reputation = MAX_CREDIT_SCORE;
            }
        }
        
        creditLine.lastUpdated = block.timestamp;

        emit LoanRepaid(msg.sender, amount);
        emit CreditLineUpdated(
            msg.sender,
            creditLine.totalAmount,
            creditLine.usedAmount,
            creditLine.reputation
        );
        
        if (creditLine.reputation > oldReputation) {
            emit ReputationUpdated(msg.sender, oldReputation, creditLine.reputation);
        }
    }
    /**
     * @dev Requests funding for a project
     * @param hackathonIds IDs of the hackathons
     * @param githubUrl GitHub URL of the project
     * @param projectName Name of the project
     * @param milestoneDescriptions Array of milestone descriptions
     * @param milestoneAmounts Array of milestone amounts
     * @return projectId ID of the created project
     */
    function requestFunding(
        uint256[] calldata hackathonIds,
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
        return _requestFunding(hackathonIds, githubUrl, projectName, milestoneDescriptions, milestoneAmounts);
    }

    function _requestFunding(
        uint256[] calldata hackathonIds,
        string calldata githubUrl,
        string calldata projectName,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmounts
    ) 
        internal 
        returns (uint256) 
    {
        require(bytes(githubUrl).length > 0, "GitHub URL cannot be empty");
        require(bytes(projectName).length > 0, "Project name cannot be empty");
        require(milestoneDescriptions.length == milestoneAmounts.length, "Mismatched milestone arrays");
        require(milestoneDescriptions.length > 0, "No milestones provided");
        require(hackathonIds.length > 0, "At least one hackathon required");
        require(hackathonIds.length <= 5, "Too many hackathons");
        
        // Calculate total funding amount
        uint256 totalAmount = 0;
        for (uint i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "Milestone amount must be greater than 0");
            totalAmount += milestoneAmounts[i];
        }
        
        uint256 effectiveCreditScore = _getVerifiedCreditScore(msg.sender);
        
        // Calculate max funding based on verified credit score
        uint256 maxFunding = calculateFundingAmount(effectiveCreditScore);
        require(totalAmount <= maxFunding, "Requested amount exceeds credit limit");
        
        // Update or create credit line
        _updateCreditLine(msg.sender, effectiveCreditScore, totalAmount);
        
        // Create new project
        _projectIdCounter.increment();
        uint256 projectId = _projectIdCounter.current();
        
        projects[projectId] = Project({
            hackathonIds: hackathonIds,
            developer: msg.sender,
            githubUrl: githubUrl,
            name: projectName,
            fundingAmount: totalAmount,
            isActive: true,
            fundedAt: block.timestamp,
            creditScore: effectiveCreditScore,
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
        
        emit ProjectCreated(projectId, hackathonIds, msg.sender, totalAmount, projectName);
        
        return projectId;
    }

    /**
     * @dev Requests funding for a project with a team
     * @param hackathonIds IDs of the hackathons
     * @param githubUrl GitHub URL of the project
     * @param projectName Name of the project
     * @param milestoneDescriptions Array of milestone descriptions
     * @param milestoneAmounts Array of milestone amounts
     * @param teamMembers Array of team member addresses
     * @param teamShares Array of team member shares in basis points
     * @return projectId ID of the created project
     */
    function requestFundingWithTeam(
        uint256[] calldata hackathonIds,
        string calldata githubUrl,
        string calldata projectName,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmounts,
        address[] calldata teamMembers,
        uint256[] calldata teamShares
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        require(teamMembers.length == teamShares.length, "Mismatched team arrays");
        require(teamMembers.length <= 10, "Too many team members");
        
        uint256 totalShares = 0;
        for (uint i = 0; i < teamShares.length; i++) {
            totalShares += teamShares[i];
        }
        require(totalShares == 10000, "Total shares must be 100%");

        // Create the project using the internal logic
        uint256 projectId = _requestFunding(
            hackathonIds,
            githubUrl,
            projectName,
            milestoneDescriptions,
            milestoneAmounts
        );

        // Record the team
        for (uint i = 0; i < teamMembers.length; i++) {
            projectTeams[projectId].push(TeamMember({
                member: teamMembers[i],
                share: teamShares[i]
            }));
        }

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
        
        // Verify the caller is an authorized verifier for any of the project's hackathons
        bool isAuthorized = false;
        uint256 minRequiredSignatures = 999;
        
        for (uint i = 0; i < project.hackathonIds.length; i++) {
            uint256 hId = project.hackathonIds[i];
            if (registry.isVerifier(hId, msg.sender)) {
                isAuthorized = true;
            }
            uint256 req = registry.getRequiredSignatures(hId);
            if (req < minRequiredSignatures) {
                minRequiredSignatures = req;
            }
        }
        
        require(isAuthorized, "Not an authorized verifier");
        
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
        
        // Check if threshold reached (using the minimum required signatures of the expedition's hackathons)
        if (approval.approvalCount >= minRequiredSignatures) {
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
        
        // Split the milestone amount if a team is configured
        TeamMember[] storage team = projectTeams[projectId];
        if (team.length > 0) {
            uint256 remainingAmount = milestone.amount;
            for (uint i = 0; i < team.length; i++) {
                uint256 memberAmount = (milestone.amount * team[i].share) / 10000;
                if (memberAmount > 0) {
                    usdcToken.safeTransfer(team[i].member, memberAmount);
                    remainingAmount -= memberAmount;
                }
            }
            // Dust/rounding handling: send remaining to developer
            if (remainingAmount > 0) {
                usdcToken.safeTransfer(project.developer, remainingAmount);
            }
        } else {
            // Transfer the milestone amount to the developer
            usdcToken.safeTransfer(project.developer, milestone.amount);
        }
        
        // Update developer's reputation
        CreditLine storage creditLine = creditLines[project.developer];
        creditLine.reputation += 1; // Increment reputation for each completed milestone
        creditLine.lastUpdated = block.timestamp;
        
        emit MilestoneCompleted(projectId, milestoneId, milestone.amount, project.developer);
    }
    
    /**
     * @dev Updates a developer's credit line
     * @param developer Address of the developer
     * @param reputation Reputation/Credit score of the developer
     * @param requestedAmount Amount requested for funding
     */
    function _updateCreditLine(
        address developer, 
        uint256 reputation,
        uint256 requestedAmount
    ) 
        internal 
    {
        CreditLine storage creditLine = creditLines[developer];
        
        if (creditLine.lastUpdated == 0) {
            // New credit line based on verified reputation
            creditLine.totalAmount = calculateFundingAmount(reputation);
            creditLine.usedAmount = requestedAmount;
            creditLine.reputation = reputation;
            creditLine.active = true;
            creditLine.lastUpdated = block.timestamp;
        } else {
            // Update existing credit line
            creditLine.usedAmount += requestedAmount;
            
            // If their reputation has improved, increase their credit line
            if (reputation > creditLine.reputation) {
                creditLine.totalAmount = calculateFundingAmount(reputation);
                creditLine.reputation = reputation;
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
     * @dev Backs a project with USDC
     * @param projectId ID of the project
     * @param multiplier Multiplier choice (e.g., 150, 200, 300 for 1.5x, 2x, 3x)
     * @param amount Amount of USDC to stake
     */
    function backProject(uint256 projectId, uint256 multiplier, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Project storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(amount > 0, "Amount must be > 0");

        // Reputation-Adjusted Interest (Dynamic Multipliers)
        uint256 maxAllowedMultiplier = getMaxMultiplier(project.creditScore);
        require(multiplier <= maxAllowedMultiplier, "Multiplier exceeds allowed limit for this builder's reputation");
        require(multiplier >= 100, "Invalid multiplier"); // At least 1x

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        projectBackings[projectId].push(Backing({
            backer: msg.sender,
            amount: amount,
            multiplier: multiplier,
            claimed: false
        }));

        totalProjectBacking[projectId] += amount;
        
        // Track project for this backer
        backerProjects[msg.sender].push(projectId);

        // Reputation Multiplier: If developer stakes on themselves, they get a small reputation boost
        // This incentivizes "Skin in the Game" (Bootstrap Loop)
        if (msg.sender == project.developer) {
            CreditLine storage devCredit = creditLines[project.developer];
            uint256 repBonus = amount / 200e6; // +1 rep for every 200 USDC self-staked
            if (repBonus > 0) {
                devCredit.reputation += repBonus;
                if (devCredit.reputation > MAX_CREDIT_SCORE) devCredit.reputation = MAX_CREDIT_SCORE;
            }
        }

        // Also boost the credit line of the developer (Market Confidence)
        CreditLine storage creditLine = creditLines[project.developer];
        creditLine.totalAmount += (amount * 2); // 2x confidence boost
        
        emit ProjectBacked(projectId, msg.sender, amount, multiplier);
    }

    /**
     * @dev Pledges expected prize for a project
     * @param projectId ID of the project
     * @param amount Expected prize amount
     */
    function pledgePrize(uint256 projectId, uint256 amount) external {
        require(projects[projectId].developer == msg.sender, "Only developer can pledge");
        projectPledgedPrize[projectId] = amount;
        emit PrizePledged(projectId, amount);
    }

    /**
     * @dev Distributes prize and handles backer repayments
     * @param projectId ID of the project
     * @param prizeAmount Total prize amount being distributed
     */
    function distributePrize(uint256 projectId, uint256 prizeAmount) 
        external 
        onlyRole(TREASURY_ROLE) 
        nonReentrant 
    {
        require(prizeAmount > 0, "Prize amount must be > 0");
        
        usdcToken.safeTransferFrom(msg.sender, address(this), prizeAmount);

        uint256 totalBackerPayout = 0;
        Backing[] storage backings = projectBackings[projectId];
        
        for (uint i = 0; i < backings.length; i++) {
            if (!backings[i].claimed) {
                uint256 payout = (backings[i].amount * backings[i].multiplier) / 100;
                if (prizeAmount >= totalBackerPayout + payout) {
                    backings[i].claimed = true;
                    totalBackerPayout += payout;
                    usdcToken.safeTransfer(backings[i].backer, payout);
                }
            }
        }

        uint256 builderPayout = 0;
        if (prizeAmount > totalBackerPayout) {
            builderPayout = prizeAmount - totalBackerPayout;
            usdcToken.safeTransfer(projects[projectId].developer, builderPayout);
        }

        emit PrizeDistributed(projectId, prizeAmount, totalBackerPayout, builderPayout);
    }

    /**
     * @dev Calculates funding amount based on credit score
     * @param creditScore Credit score of the developer
     * @return amount Calculated funding amount
     */
    function calculateFundingAmount(uint256 creditScore) public view returns (uint256) {
        if (creditScore < MIN_CREDIT_SCORE) {
            return 0;
        }

        if (creditScore >= 800) {
            return maxCreditAmount;
        }

        uint256 minFunding = baseCreditAmount;
        uint256 fundingRange = maxCreditAmount - minFunding;
        uint256 scoreRange = 800 - MIN_CREDIT_SCORE;
        uint256 adjustedScore = creditScore - MIN_CREDIT_SCORE;

        return minFunding + (fundingRange * adjustedScore) / scoreRange;
    }

    function setReputation(address developer, uint256 reputation) external onlyRole(SCORER_ROLE) {
        require(developer != address(0), "Invalid developer");
        require(reputation >= MIN_CREDIT_SCORE && reputation <= MAX_CREDIT_SCORE, "Reputation must be within valid range");

        uint256 oldReputation = creditLines[developer].reputation;
        creditLines[developer].reputation = reputation;

        if (creditLines[developer].lastUpdated != 0) {
            creditLines[developer].totalAmount = calculateFundingAmount(reputation);
            creditLines[developer].lastUpdated = block.timestamp;
        }

        emit ReputationUpdated(developer, oldReputation, reputation);
        emit CreditLineUpdated(
            developer,
            creditLines[developer].totalAmount,
            creditLines[developer].usedAmount,
            reputation
        );
    }

    function _getVerifiedCreditScore(address developer) internal view returns (uint256) {
        uint256 score = creditLines[developer].reputation;
        require(score >= MIN_CREDIT_SCORE, "Credit score not verified");
        return score;
    }

    /**
     * @dev Posts a project check-in (Proof of Activity)
     * @param projectId ID of the project
     * @param metadata Metadata describing the check-in
     */
    function postCheckIn(uint256 projectId, string calldata metadata) external {
        require(projects[projectId].developer == msg.sender, "Only developer can check-in");
        require(projects[projectId].isActive, "Project is not active");
        
        projectCheckIns[projectId].push(CheckIn({
            timestamp: block.timestamp,
            metadata: metadata
        }));

        // Boost reputation slightly for consistent check-ins
        creditLines[msg.sender].reputation += 1;
        if (creditLines[msg.sender].reputation > MAX_CREDIT_SCORE) {
            creditLines[msg.sender].reputation = MAX_CREDIT_SCORE;
        }

        emit CheckInPosted(projectId, block.timestamp, metadata);
    }

    /**
     * @dev Calculates boosted funding amount including backer confidence
     * @param creditScore Credit score of the developer
     * @param projectId ID of the project
     * @return amount Calculated funding amount
     */
    function calculateBoostedFundingAmount(uint256 creditScore, uint256 projectId) public view returns (uint256) {
        uint256 baseAmount = calculateFundingAmount(creditScore);
        
        // Confidence Boost: 2 * totalProjectBacking
        uint256 boostedAmount = baseAmount + (2 * totalProjectBacking[projectId]);
        
        // Increase max credit by backing amount
        uint256 currentMax = maxCreditAmount + totalProjectBacking[projectId];
        
        return boostedAmount > currentMax ? currentMax : boostedAmount;
    }

    /**
     * @dev Returns the maximum allowed multiplier based on credit score
     * @param creditScore Credit score of the builder
     * @return maxMultiplier Max allowed multiplier (e.g., 150 for 1.5x)
     */
    function getMaxMultiplier(uint256 creditScore) public pure returns (uint256) {
        if (creditScore >= 800) {
            return 150; // 1.5x
        } else if (creditScore >= 700) {
            return 200; // 2.0x
        } else if (creditScore >= 600) {
            return 250; // 2.5x
        } else {
            return 300; // 3.0x
        }
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
     * @dev Gets all projects backed by an address
     * @param backer Address of the backer
     * @return Array of project IDs
     */
    function getBackerProjects(address backer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return backerProjects[backer];
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
     * @dev Gets all check-ins for a project
     * @param projectId ID of the project
     * @return Array of check-ins
     */
    function getProjectCheckIns(uint256 projectId) 
        external 
        view 
        returns (CheckIn[] memory) 
    {
        return projectCheckIns[projectId];
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
     * @dev Gets the number of backers for a project
     * @param projectId ID of the project
     * @return Number of backers
     */
    function getProjectBackerCount(uint256 projectId) 
        external 
        view 
        returns (uint256) 
    {
        return projectBackings[projectId].length;
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