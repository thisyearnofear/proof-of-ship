// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IHackathonRegistry.sol";

/**
 * @title BuilderCreditCore
 * @dev Core contract for the Builder Credit platform
 * Manages credit lines, projects, milestones, and funding
 *
 * UUPS upgradeable — deploy via hardhat-upgrades deployProxy.
 * _authorizeUpgrade is gated to DEFAULT_ADMIN_ROLE.
 * initialize() replaces the constructor pattern.
 *
 * IMPORTANT: When upgrading, new versions must preserve storage layout.
 * Append new storage variables at the end — do NOT reorder or remove existing ones.
 */
contract BuilderCreditCore is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant SCORER_ROLE = keccak256("SCORER_ROLE");

    // ── Storage ──────────────────────────────────────────────────
    // WARNING: Storage layout is fixed after first deploy.
    // Append new variables at the end; never reorder or delete.

    Counters.Counter private _projectIdCounter;

    IHackathonRegistry public registry;
    IERC20 public usdcToken;

    uint256 public constant MIN_CREDIT_SCORE = 400;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    uint256 public baseCreditAmount;
    uint256 public creditMultiplier;
    uint256 public maxCreditAmount;

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
        uint256 multiplier;
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
        string metadata;
    }

    struct TeamMember {
        address member;
        uint256 share;
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

    event ReputationUpdated(
        address indexed developer,
        uint256 oldReputation,
        uint256 newReputation
    );
    event LoanRepaid(address indexed developer, uint256 amount);
    event FundsWithdrawn(address token, address to, uint256 amount);
    event CreditParametersUpdated(
        uint256 base,
        uint256 multiplier,
        uint256 max
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract (replaces constructor for UUPS proxy pattern).
     * @param _registry Address of the HackathonRegistry contract
     * @param _usdcToken Address of the USDC token contract
     * @param _admin Address that receives all default admin roles
     */
    function initialize(
        address _registry,
        address _usdcToken,
        address _admin
    ) external initializer {
        require(_registry != address(0), "Invalid registry address");
        require(_usdcToken != address(0), "Invalid token address");
        require(_admin != address(0), "Invalid admin address");

        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        registry = IHackathonRegistry(_registry);
        usdcToken = IERC20(_usdcToken);

        baseCreditAmount = 500 * 1e6; // 500 USDC
        creditMultiplier = 10 * 1e6; // Legacy, unused in logic
        maxCreditAmount = 5000 * 1e6; // 5,000 USDC

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PLATFORM_ADMIN_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _admin);
        _grantRole(SCORER_ROLE, _admin);
    }

    /**
     * @dev UUPS: only DEFAULT_ADMIN_ROLE can authorize an upgrade.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ── Core functions ───────────────────────────────────────────

    /**
     * @dev Repays a loan for a developer
     * @param amount Amount of USDC to repay
     */
    function repayLoan(
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        CreditLine storage creditLine = creditLines[msg.sender];
        require(creditLine.active, "No active credit line");
        require(
            amount <= creditLine.usedAmount,
            "Repayment exceeds used amount"
        );

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 oldReputation = creditLine.reputation;
        creditLine.usedAmount -= amount;

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
            emit ReputationUpdated(
                msg.sender,
                oldReputation,
                creditLine.reputation
            );
        }
    }

    /**
     * @dev Requests funding for a project
     */
    function requestFunding(
        uint256[] calldata hackathonIds,
        string calldata githubUrl,
        string calldata projectName,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmounts
    ) external whenNotPaused nonReentrant returns (uint256) {
        return
            _requestFunding(
                hackathonIds,
                githubUrl,
                projectName,
                milestoneDescriptions,
                milestoneAmounts
            );
    }

    function _requestFunding(
        uint256[] calldata hackathonIds,
        string calldata githubUrl,
        string calldata projectName,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmounts
    ) internal returns (uint256) {
        require(bytes(githubUrl).length > 0, "GitHub URL cannot be empty");
        require(
            bytes(projectName).length > 0,
            "Project name cannot be empty"
        );
        require(
            milestoneDescriptions.length == milestoneAmounts.length,
            "Mismatched milestone arrays"
        );
        require(
            milestoneDescriptions.length > 0,
            "No milestones provided"
        );
        require(hackathonIds.length > 0, "At least one hackathon required");
        require(hackathonIds.length <= 5, "Too many hackathons");

        uint256 totalAmount = 0;
        for (uint i = 0; i < milestoneAmounts.length; i++) {
            require(
                milestoneAmounts[i] > 0,
                "Milestone amount must be greater than 0"
            );
            totalAmount += milestoneAmounts[i];
        }

        uint256 effectiveCreditScore = _getVerifiedCreditScore(msg.sender);
        uint256 maxFunding = calculateFundingAmount(effectiveCreditScore);
        require(
            totalAmount <= maxFunding,
            "Requested amount exceeds credit limit"
        );

        _updateCreditLine(msg.sender, effectiveCreditScore, totalAmount);

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

        for (uint i = 0; i < milestoneDescriptions.length; i++) {
            projectMilestones[projectId].push(
                Milestone({
                    description: milestoneDescriptions[i],
                    amount: milestoneAmounts[i],
                    completed: false,
                    completedAt: 0
                })
            );
        }

        developerProjects[msg.sender].push(projectId);

        emit ProjectCreated(
            projectId,
            hackathonIds,
            msg.sender,
            totalAmount,
            projectName
        );

        return projectId;
    }

    /**
     * @dev Requests funding for a project with a team
     */
    function requestFundingWithTeam(
        uint256[] calldata hackathonIds,
        string calldata githubUrl,
        string calldata projectName,
        string[] calldata milestoneDescriptions,
        uint256[] calldata milestoneAmounts,
        address[] calldata teamMembers,
        uint256[] calldata teamShares
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(
            teamMembers.length == teamShares.length,
            "Mismatched team arrays"
        );
        require(teamMembers.length <= 10, "Too many team members");

        uint256 totalShares = 0;
        for (uint i = 0; i < teamShares.length; i++) {
            totalShares += teamShares[i];
        }
        require(totalShares == 10000, "Total shares must be 100%");

        uint256 projectId = _requestFunding(
            hackathonIds,
            githubUrl,
            projectName,
            milestoneDescriptions,
            milestoneAmounts
        );

        for (uint i = 0; i < teamMembers.length; i++) {
            projectTeams[projectId].push(
                TeamMember({member: teamMembers[i], share: teamShares[i]})
            );
        }

        return projectId;
    }

    /**
     * @dev Approves a milestone for a project
     */
    function approveMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external whenNotPaused nonReentrant {
        Project storage project = projects[projectId];
        require(project.isActive, "Project is not active");

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

        require(
            milestoneId < projectMilestones[projectId].length,
            "Invalid milestone ID"
        );
        Milestone storage milestone = projectMilestones[projectId][milestoneId];
        require(!milestone.completed, "Milestone already completed");

        MilestoneApproval storage approval = approvals[projectId][milestoneId];
        require(
            !approval.hasApproved[msg.sender],
            "Already approved by this verifier"
        );

        approval.hasApproved[msg.sender] = true;
        approval.approvalCount++;

        emit MilestoneApproved(projectId, milestoneId, msg.sender);

        if (approval.approvalCount >= minRequiredSignatures) {
            _completeMilestone(projectId, milestoneId);
        }
    }

    function _completeMilestone(uint256 projectId, uint256 milestoneId) internal {
        Milestone storage milestone = projectMilestones[projectId][milestoneId];
        milestone.completed = true;
        milestone.completedAt = block.timestamp;
        approvals[projectId][milestoneId].isCompleted = true;

        Project storage project = projects[projectId];
        project.milestonesCompleted++;

        if (project.milestonesCompleted == project.milestonesCount) {
            project.isActive = false;
        }

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
            if (remainingAmount > 0) {
                usdcToken.safeTransfer(project.developer, remainingAmount);
            }
        } else {
            usdcToken.safeTransfer(project.developer, milestone.amount);
        }

        CreditLine storage creditLine = creditLines[project.developer];
        creditLine.reputation += 1;
        creditLine.lastUpdated = block.timestamp;

        emit MilestoneCompleted(
            projectId,
            milestoneId,
            milestone.amount,
            project.developer
        );
    }

    function _updateCreditLine(
        address developer,
        uint256 reputation,
        uint256 requestedAmount
    ) internal {
        CreditLine storage creditLine = creditLines[developer];

        if (creditLine.lastUpdated == 0) {
            creditLine.totalAmount = calculateFundingAmount(reputation);
            creditLine.usedAmount = requestedAmount;
            creditLine.reputation = reputation;
            creditLine.active = true;
            creditLine.lastUpdated = block.timestamp;
        } else {
            creditLine.usedAmount += requestedAmount;
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
     */
    function backProject(
        uint256 projectId,
        uint256 multiplier,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        Project storage project = projects[projectId];
        require(project.isActive, "Project not active");
        require(amount > 0, "Amount must be > 0");

        uint256 maxAllowedMultiplier = getMaxMultiplier(project.creditScore);
        require(
            multiplier <= maxAllowedMultiplier,
            "Multiplier exceeds allowed limit for this builder's reputation"
        );
        require(multiplier >= 100, "Invalid multiplier");

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        projectBackings[projectId].push(
            Backing({
                backer: msg.sender,
                amount: amount,
                multiplier: multiplier,
                claimed: false
            })
        );

        totalProjectBacking[projectId] += amount;
        backerProjects[msg.sender].push(projectId);

        if (msg.sender == project.developer) {
            CreditLine storage devCredit = creditLines[project.developer];
            uint256 repBonus = amount / 200e6;
            if (repBonus > 0) {
                devCredit.reputation += repBonus;
                if (devCredit.reputation > MAX_CREDIT_SCORE)
                    devCredit.reputation = MAX_CREDIT_SCORE;
            }
        }

        CreditLine storage creditLine = creditLines[project.developer];
        creditLine.totalAmount += (amount * 2);

        emit ProjectBacked(projectId, msg.sender, amount, multiplier);
    }

    /**
     * @dev Pledges expected prize for a project
     */
    function pledgePrize(
        uint256 projectId,
        uint256 amount
    ) external {
        require(
            projects[projectId].developer == msg.sender,
            "Only developer can pledge"
        );
        projectPledgedPrize[projectId] = amount;
        emit PrizePledged(projectId, amount);
    }

    /**
     * @dev Distributes prize and handles backer repayments
     */
    function distributePrize(
        uint256 projectId,
        uint256 prizeAmount
    ) external onlyRole(TREASURY_ROLE) nonReentrant {
        require(prizeAmount > 0, "Prize amount must be > 0");

        usdcToken.safeTransferFrom(msg.sender, address(this), prizeAmount);

        uint256 totalBackerPayout = 0;
        Backing[] storage backings = projectBackings[projectId];

        for (uint i = 0; i < backings.length; i++) {
            if (!backings[i].claimed) {
                uint256 payout = (backings[i].amount * backings[i].multiplier) /
                    100;
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
            usdcToken.safeTransfer(
                projects[projectId].developer,
                builderPayout
            );
        }

        emit PrizeDistributed(
            projectId,
            prizeAmount,
            totalBackerPayout,
            builderPayout
        );
    }

    /**
     * @dev Calculates funding amount based on credit score
     */
    function calculateFundingAmount(
        uint256 creditScore
    ) public view returns (uint256) {
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

    function setReputation(
        address developer,
        uint256 reputation
    ) external onlyRole(SCORER_ROLE) {
        require(developer != address(0), "Invalid developer");
        require(
            reputation >= MIN_CREDIT_SCORE &&
                reputation <= MAX_CREDIT_SCORE,
            "Reputation must be within valid range"
        );

        uint256 oldReputation = creditLines[developer].reputation;
        creditLines[developer].reputation = reputation;

        if (creditLines[developer].lastUpdated != 0) {
            creditLines[developer].totalAmount = calculateFundingAmount(
                reputation
            );
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

    function _getVerifiedCreditScore(
        address developer
    ) internal view returns (uint256) {
        uint256 score = creditLines[developer].reputation;
        require(
            score >= MIN_CREDIT_SCORE,
            "Credit score not verified"
        );
        return score;
    }

    /**
     * @dev Posts a project check-in (Proof of Activity)
     */
    function postCheckIn(
        uint256 projectId,
        string calldata metadata
    ) external {
        require(
            projects[projectId].developer == msg.sender,
            "Only developer can check-in"
        );
        require(projects[projectId].isActive, "Project is not active");

        projectCheckIns[projectId].push(
            CheckIn({
                timestamp: block.timestamp,
                metadata: metadata
            })
        );

        creditLines[msg.sender].reputation += 1;
        if (creditLines[msg.sender].reputation > MAX_CREDIT_SCORE) {
            creditLines[msg.sender].reputation = MAX_CREDIT_SCORE;
        }

        emit CheckInPosted(projectId, block.timestamp, metadata);
    }

    /**
     * @dev Calculates boosted funding amount including backer confidence
     */
    function calculateBoostedFundingAmount(
        uint256 creditScore,
        uint256 projectId
    ) public view returns (uint256) {
        uint256 baseAmount = calculateFundingAmount(creditScore);
        uint256 boostedAmount = baseAmount + (2 * totalProjectBacking[projectId]);
        uint256 currentMax = maxCreditAmount + totalProjectBacking[projectId];
        return boostedAmount > currentMax ? currentMax : boostedAmount;
    }

    /**
     * @dev Returns the maximum allowed multiplier based on credit score
     */
    function getMaxMultiplier(
        uint256 creditScore
    ) public pure returns (uint256) {
        if (creditScore >= 800) {
            return 150;
        } else if (creditScore >= 700) {
            return 200;
        } else if (creditScore >= 600) {
            return 250;
        } else {
            return 300;
        }
    }

    /**
     * @dev Updates credit calculation parameters
     */
    function updateCreditParameters(
        uint256 _baseCreditAmount,
        uint256 _creditMultiplier,
        uint256 _maxCreditAmount
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        baseCreditAmount = _baseCreditAmount;
        creditMultiplier = _creditMultiplier;
        maxCreditAmount = _maxCreditAmount;

        emit CreditParametersUpdated(
            _baseCreditAmount,
            _creditMultiplier,
            _maxCreditAmount
        );
    }

    /**
     * @dev Withdraws funds from the contract
     */
    function withdrawFunds(
        address token,
        uint256 amount
    ) external onlyRole(TREASURY_ROLE) nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );

        tokenContract.safeTransfer(msg.sender, amount);

        emit FundsWithdrawn(token, msg.sender, amount);
    }

    function getBackerProjects(
        address backer
    ) external view returns (uint256[] memory) {
        return backerProjects[backer];
    }

    function getProjectMilestones(
        uint256 projectId
    ) external view returns (Milestone[] memory) {
        return projectMilestones[projectId];
    }

    function getProjectCheckIns(
        uint256 projectId
    ) external view returns (CheckIn[] memory) {
        return projectCheckIns[projectId];
    }

    function getDeveloperProjects(
        address developer
    ) external view returns (uint256[] memory) {
        return developerProjects[developer];
    }

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

    function getProjectBackerCount(
        uint256 projectId
    ) external view returns (uint256) {
        return projectBackings[projectId].length;
    }

    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
    }

    function updateRegistry(
        address _registry
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(_registry != address(0), "Invalid registry address");
        registry = IHackathonRegistry(_registry);
    }

    function updateUsdcToken(
        address _usdcToken
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(_usdcToken != address(0), "Invalid token address");
        usdcToken = IERC20(_usdcToken);
    }
}
