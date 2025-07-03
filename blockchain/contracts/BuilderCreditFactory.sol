// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./BuilderCreditCore.sol";
import "./interfaces/IBuilderCredit.sol";

/**
 * @title BuilderCreditFactory
 * @dev Factory contract for deploying BuilderCredit instances
 * Uses minimal proxy pattern for gas-efficient deployments
 */
contract BuilderCreditFactory is AccessControl {
    using Clones for address;
    
    // Role definition
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    // Implementation addresses
    address public currentImplementation;
    mapping(uint256 => address) public versionToImplementation;
    uint256 public latestVersion;
    
    // Deployed contracts
    address[] public deployedContracts;
    mapping(address => bool) public isDeployedContract;
    
    // Events
    event ImplementationAdded(uint256 indexed version, address implementation);
    event ContractDeployed(address indexed deployedAt, address implementation, uint256 version);
    
    /**
     * @dev Constructor to initialize the factory
     * @param _admin Address of the admin
     * @param _implementation Address of the initial implementation
     */
    constructor(address _admin, address _implementation) {
        require(_admin != address(0), "Invalid admin address");
        require(_implementation != address(0), "Invalid implementation");
        
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        _setupRole(DEPLOYER_ROLE, _admin);
        
        // Set initial implementation
        latestVersion = 1;
        versionToImplementation[latestVersion] = _implementation;
        currentImplementation = _implementation;
        
        emit ImplementationAdded(latestVersion, _implementation);
    }
    
    /**
     * @dev Add a new implementation version
     * @param _implementation Address of the new implementation
     */
    function addImplementation(address _implementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_implementation != address(0), "Invalid implementation");
        
        latestVersion += 1;
        versionToImplementation[latestVersion] = _implementation;
        currentImplementation = _implementation;
        
        emit ImplementationAdded(latestVersion, _implementation);
    }
    
    /**
     * @dev Deploy a new BuilderCredit instance
     * @param _usdc Address of the USDC token contract
     * @param _admin Address of the admin for the new instance
     * @param _oracles Array of oracle addresses for the new instance
     * @param _version Version of the implementation to use (0 for latest)
     * @return instance Address of the deployed instance
     */
    function deployBuilderCredit(
        address _usdc,
        address _admin,
        address[] memory _oracles,
        uint256 _version
    ) external onlyRole(DEPLOYER_ROLE) returns (address instance) {
        // Determine which implementation to use
        address implementation;
        if (_version == 0) {
            implementation = currentImplementation;
            _version = latestVersion;
        } else {
            require(_version <= latestVersion, "Version does not exist");
            implementation = versionToImplementation[_version];
        }
        
        // Deploy clone
        instance = implementation.clone();
        
        // Initialize the instance
        BuilderCreditCore(instance).initialize(_usdc, _admin, _oracles);
        
        // Track deployed contract
        deployedContracts.push(instance);
        isDeployedContract[instance] = true;
        
        emit ContractDeployed(instance, implementation, _version);
    }
    
    /**
     * @dev Get all deployed contracts
     * @return Array of deployed contract addresses
     */
    function getAllDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
    
    /**
     * @dev Count of deployed contracts
     * @return Number of deployed contracts
     */
    function deployedContractsCount() external view returns (uint256) {
        return deployedContracts.length;
    }
}