// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IBuilderCredit.sol";

/**
 * @title BuilderCreditScoring
 * @dev Advanced credit scoring contract for BuilderCredit system
 * Handles the integration with external data sources for developer credit scoring
 */
contract BuilderCreditScoring is AccessControl, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Constants
    uint256 public constant MIN_CREDIT_SCORE = 400;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    uint256 public constant SIGNATURE_VALIDITY_PERIOD = 1 hours;
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DATA_PROVIDER_ROLE = keccak256("DATA_PROVIDER_ROLE");
    
    // Builder Credit contract
    IBuilderCredit public builderCredit;
    
    // Data structures
    struct CreditFactor {
        string name;
        uint256 weight;
        bool isActive;
    }
    
    struct CreditData {
        address developer;
        string githubUsername;
        mapping(bytes32 => uint256) factorScores; // factor ID => score
        uint256 totalScore;
        uint256 timestamp;
        bool isVerified;
    }
    
    // State variables
    mapping(bytes32 => CreditFactor) public creditFactors;
    bytes32[] public creditFactorIds;
    mapping(address => CreditData) public developerCreditData;
    mapping(address => string) public developerToGithub;
    mapping(string => address) public githubToDeveloper;
    
    // Events
    event CreditFactorAdded(bytes32 indexed factorId, string name, uint256 weight);
    event CreditFactorUpdated(bytes32 indexed factorId, string name, uint256 weight, bool isActive);
    event CreditScoreUpdated(address indexed developer, uint256 newScore);
    event GithubAccountLinked(address indexed developer, string githubUsername);
    event DataProviderAdded(address provider);
    event DataProviderRemoved(address provider);
    event BuilderCreditContractUpdated(address newContract);
    
    /**
     * @dev Constructor
     * @param _admin Admin address
     * @param _builderCredit BuilderCredit contract address
     * @param _dataProviders Initial data provider addresses
     */
    constructor(
        address _admin, 
        address _builderCredit,
        address[] memory _dataProviders
    ) {
        require(_admin != address(0), "Invalid admin address");
        require(_builderCredit != address(0), "Invalid BuilderCredit address");
        
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(ADMIN_ROLE, _admin);
        
        builderCredit = IBuilderCredit(_builderCredit);
        
        // Add data providers
        for (uint256 i = 0; i < _dataProviders.length; i++) {
            require(_dataProviders[i] != address(0), "Invalid data provider address");
            _setupRole(DATA_PROVIDER_ROLE, _dataProviders[i]);
            emit DataProviderAdded(_dataProviders[i]);
        }
        
        // Initialize default credit factors
        _addCreditFactor("github_commits", 20);
        _addCreditFactor("github_stars", 15);
        _addCreditFactor("github_forks", 10);
        _addCreditFactor("github_issues", 5);
        _addCreditFactor("github_pull_requests", 15);
        _addCreditFactor("onchain_transactions", 10);
        _addCreditFactor("onchain_contracts_deployed", 15);
        _addCreditFactor("repayment_history", 30);
        _addCreditFactor("loan_utilization", 10);
        _addCreditFactor("completed_milestones", 20);
    }
    
    /**
     * @dev Pause the contract
     * Only callable by admin
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     * Only callable by admin
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Add a data provider
     * @param provider Address of the data provider
     */
    function addDataProvider(address provider) external onlyRole(ADMIN_ROLE) {
        require(provider != address(0), "Invalid provider address");
        require(!hasRole(DATA_PROVIDER_ROLE, provider), "Already a provider");
        
        grantRole(DATA_PROVIDER_ROLE, provider);
        emit DataProviderAdded(provider);
    }
    
    /**
     * @dev Remove a data provider
     * @param provider Address of the data provider
     */
    function removeDataProvider(address provider) external onlyRole(ADMIN_ROLE) {
        require(hasRole(DATA_PROVIDER_ROLE, provider), "Not a provider");
        
        revokeRole(DATA_PROVIDER_ROLE, provider);
        emit DataProviderRemoved(provider);
    }
    
    /**
     * @dev Update the BuilderCredit contract
     * @param newContract Address of the new BuilderCredit contract
     */
    function updateBuilderCreditContract(address newContract) external onlyRole(ADMIN_ROLE) {
        require(newContract != address(0), "Invalid contract address");
        
        builderCredit = IBuilderCredit(newContract);
        emit BuilderCreditContractUpdated(newContract);
    }
    
    /**
     * @dev Add a new credit factor
     * @param name Name of the factor
     * @param weight Weight of the factor
     */
    function addCreditFactor(string memory name, uint256 weight) external onlyRole(ADMIN_ROLE) {
        _addCreditFactor(name, weight);
    }
    
    /**
     * @dev Internal function to add a credit factor
     * @param name Name of the factor
     * @param weight Weight of the factor
     */
    function _addCreditFactor(string memory name, uint256 weight) internal {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(weight > 0, "Weight must be greater than 0");
        
        bytes32 factorId = keccak256(abi.encodePacked(name));
        require(creditFactors[factorId].weight == 0, "Factor already exists");
        
        creditFactors[factorId] = CreditFactor({
            name: name,
            weight: weight,
            isActive: true
        });
        
        creditFactorIds.push(factorId);
        
        emit CreditFactorAdded(factorId, name, weight);
    }
    
    /**
     * @dev Update an existing credit factor
     * @param factorId ID of the factor
     * @param name New name (or empty to keep current)
     * @param weight New weight (or 0 to keep current)
     * @param isActive Whether the factor is active
     */
    function updateCreditFactor(
        bytes32 factorId,
        string memory name,
        uint256 weight,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        CreditFactor storage factor = creditFactors[factorId];
        require(factor.weight > 0, "Factor does not exist");
        
        if (bytes(name).length > 0) {
            factor.name = name;
        }
        
        if (weight > 0) {
            factor.weight = weight;
        }
        
        factor.isActive = isActive;
        
        emit CreditFactorUpdated(factorId, factor.name, factor.weight, factor.isActive);
    }
    
    /**
     * @dev Link GitHub account to Ethereum address
     * @param developer Address of the developer
     * @param githubUsername GitHub username
     * @param signature Signature proving ownership of GitHub account
     * @param timestamp Timestamp of the signature
     */
    function linkGithubAccount(
        address developer,
        string memory githubUsername,
        bytes memory signature,
        uint256 timestamp
    ) external whenNotPaused {
        require(bytes(githubUsername).length > 0, "Invalid GitHub username");
        require(timestamp + SIGNATURE_VALIDITY_PERIOD >= block.timestamp, "Signature expired");
        require(githubToDeveloper[githubUsername] == address(0), "GitHub already linked");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(developer, githubUsername, timestamp))
        ));
        
        address signer = messageHash.recover(signature);
        require(signer == developer, "Invalid signature");
        
        // Link accounts
        developerToGithub[developer] = githubUsername;
        githubToDeveloper[githubUsername] = developer;
        
        // Initialize credit data
        CreditData storage data = developerCreditData[developer];
        data.developer = developer;
        data.githubUsername = githubUsername;
        data.timestamp = block.timestamp;
        
        emit GithubAccountLinked(developer, githubUsername);
    }
    
    /**
     * @dev Submit credit factor data for a developer
     * @param developer Address of the developer
     * @param factorId ID of the credit factor
     * @param score Score for the factor
     * @param data Additional data for verification (if needed)
     */
    function submitCreditFactorData(
        address developer,
        bytes32 factorId,
        uint256 score,
        bytes memory data
    ) external whenNotPaused onlyRole(DATA_PROVIDER_ROLE) {
        require(developer != address(0), "Invalid developer");
        require(creditFactors[factorId].isActive, "Inactive or invalid factor");
        require(score <= 100, "Score must be <= 100");
        
        CreditData storage creditData = developerCreditData[developer];
        require(creditData.developer == developer, "Developer not registered");
        
        // Update factor score
        creditData.factorScores[factorId] = score;
        
        // Recalculate total score
        _recalculateTotalScore(developer);
        
        emit CreditScoreUpdated(developer, creditData.totalScore);
    }
    
    /**
     * @dev Submit multiple credit factors data at once
     * @param developer Address of the developer
     * @param factorIds Array of factor IDs
     * @param scores Array of scores
     */
    function submitMultipleCreditFactors(
        address developer,
        bytes32[] memory factorIds,
        uint256[] memory scores
    ) external whenNotPaused onlyRole(DATA_PROVIDER_ROLE) {
        require(developer != address(0), "Invalid developer");
        require(factorIds.length == scores.length, "Arrays length mismatch");
        
        CreditData storage creditData = developerCreditData[developer];
        require(creditData.developer == developer, "Developer not registered");
        
        for (uint256 i = 0; i < factorIds.length; i++) {
            require(creditFactors[factorIds[i]].isActive, "Inactive or invalid factor");
            require(scores[i] <= 100, "Score must be <= 100");
            
            // Update factor score
            creditData.factorScores[factorIds[i]] = scores[i];
        }
        
        // Recalculate total score
        _recalculateTotalScore(developer);
        
        emit CreditScoreUpdated(developer, creditData.totalScore);
    }
    
    /**
     * @dev Verify a developer's credit score
     * @param developer Address of the developer
     */
    function verifyCreditScore(address developer) external whenNotPaused onlyRole(DATA_PROVIDER_ROLE) {
        CreditData storage creditData = developerCreditData[developer];
        require(creditData.developer == developer, "Developer not registered");
        
        creditData.isVerified = true;
        
        // Update score in BuilderCredit contract
        builderCredit.setReputation(developer, _mapToCreditScore(creditData.totalScore));
    }
    
    /**
     * @dev Get a developer's credit score
     * @param developer Address of the developer
     * @return creditScore The credit score
     * @return isVerified Whether the score is verified
     */
    function getCreditScore(address developer) external view returns (uint256 creditScore, bool isVerified) {
        CreditData storage creditData = developerCreditData[developer];
        
        if (creditData.developer == address(0)) {
            return (MIN_CREDIT_SCORE, false);
        }
        
        return (_mapToCreditScore(creditData.totalScore), creditData.isVerified);
    }
    
    /**
     * @dev Get a developer's factor score
     * @param developer Address of the developer
     * @param factorId ID of the factor
     * @return score The factor score
     */
    function getFactorScore(address developer, bytes32 factorId) external view returns (uint256 score) {
        return developerCreditData[developer].factorScores[factorId];
    }
    
    /**
     * @dev Get all credit factors
     * @return ids Array of factor IDs
     * @return names Array of factor names
     * @return weights Array of factor weights
     * @return actives Array of factor active states
     */
    function getAllCreditFactors() external view returns (
        bytes32[] memory ids,
        string[] memory names,
        uint256[] memory weights,
        bool[] memory actives
    ) {
        uint256 count = creditFactorIds.length;
        
        ids = new bytes32[](count);
        names = new string[](count);
        weights = new uint256[](count);
        actives = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            bytes32 factorId = creditFactorIds[i];
            CreditFactor storage factor = creditFactors[factorId];
            
            ids[i] = factorId;
            names[i] = factor.name;
            weights[i] = factor.weight;
            actives[i] = factor.isActive;
        }
        
        return (ids, names, weights, actives);
    }
    
    /**
     * @dev Get a developer's GitHub username
     * @param developer Address of the developer
     * @return githubUsername The GitHub username
     */
    function getDeveloperGithub(address developer) external view returns (string memory githubUsername) {
        return developerToGithub[developer];
    }
    
    /**
     * @dev Recalculate a developer's total score
     * @param developer Address of the developer
     */
    function _recalculateTotalScore(address developer) internal {
        CreditData storage creditData = developerCreditData[developer];
        
        uint256 totalWeightedScore = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < creditFactorIds.length; i++) {
            bytes32 factorId = creditFactorIds[i];
            CreditFactor storage factor = creditFactors[factorId];
            
            if (factor.isActive) {
                uint256 score = creditData.factorScores[factorId];
                totalWeightedScore += score * factor.weight;
                totalWeight += factor.weight;
            }
        }
        
        if (totalWeight > 0) {
            creditData.totalScore = totalWeightedScore / totalWeight;
        } else {
            creditData.totalScore = 0;
        }
    }
    
    /**
     * @dev Map a weighted score (0-100) to a credit score (400-850)
     * @param weightedScore The weighted score
     * @return creditScore The credit score
     */
    function _mapToCreditScore(uint256 weightedScore) internal pure returns (uint256 creditScore) {
        if (weightedScore == 0) return MIN_CREDIT_SCORE;
        
        // Map 0-100 to MIN_CREDIT_SCORE-MAX_CREDIT_SCORE
        uint256 range = MAX_CREDIT_SCORE - MIN_CREDIT_SCORE;
        return MIN_CREDIT_SCORE + (weightedScore * range) / 100;
    }
}