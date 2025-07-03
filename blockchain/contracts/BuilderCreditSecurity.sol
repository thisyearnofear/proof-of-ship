// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./BuilderCreditStorage.sol";

/**
 * @title BuilderCreditSecurity
 * @dev Security contract for BuilderCredit
 * Handles access control, pausing, and timelock functionality
 */
contract BuilderCreditSecurity is BuilderCreditStorage, AccessControl, Pausable, ReentrancyGuard, Initializable {
    // Events
    event OperationProposed(bytes32 indexed operationId, address proposer, uint256 executeAfter);
    event OperationExecuted(bytes32 indexed operationId, address executor);
    event OperationCancelled(bytes32 indexed operationId, address canceller);
    
    /**
     * @dev Ensures operation is ready to be executed after timelock
     * @param operationId ID of the timelock operation
     */
    modifier timelockReady(bytes32 operationId) {
        TimelockOperation storage operation = _timelockOperations[operationId];
        require(operation.operationId == operationId, "Operation does not exist");
        require(!operation.executed, "Operation already executed");
        require(block.timestamp >= operation.executeAfter, "Timelock not expired");
        _;
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
     * @dev Add an oracle
     * Only callable by admin
     * @param oracle Address of the new oracle
     */
    function addOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        require(oracle != address(0), "Invalid oracle address");
        require(!hasRole(ORACLE_ROLE, oracle), "Already an oracle");
        
        grantRole(ORACLE_ROLE, oracle);
    }
    
    /**
     * @dev Remove an oracle
     * Only callable by admin
     * @param oracle Address of the oracle to remove
     */
    function removeOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ORACLE_ROLE, oracle), "Not an oracle");
        
        revokeRole(ORACLE_ROLE, oracle);
    }
    
    /**
     * @dev Propose a timelock operation
     * @param operationId Unique ID for the operation
     * @param data Operation data
     */
    function _proposeOperation(bytes32 operationId, bytes memory data) internal {
        // Create timelock operation
        TimelockOperation storage operation = _timelockOperations[operationId];
        operation.operationId = operationId;
        operation.proposer = msg.sender;
        operation.proposedAt = block.timestamp;
        operation.executeAfter = block.timestamp + TIMELOCK_DURATION;
        operation.executed = false;
        operation.data = data;
        
        emit OperationProposed(operationId, msg.sender, operation.executeAfter);
    }
    
    /**
     * @dev Cancel a timelock operation
     * Only callable by the proposer or an admin
     * @param operationId ID of the timelock operation
     */
    function cancelTimelockOperation(bytes32 operationId) external {
        TimelockOperation storage operation = _timelockOperations[operationId];
        require(operation.operationId == operationId, "Operation does not exist");
        require(!operation.executed, "Operation already executed");
        require(
            operation.proposer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not proposer or admin"
        );
        
        // Delete operation
        delete _timelockOperations[operationId];
        
        emit OperationCancelled(operationId, msg.sender);
    }
    
    /**
     * @dev Execute a timelock operation
     * @param operationId ID of the timelock operation
     */
    function _executeOperation(bytes32 operationId) internal timelockReady(operationId) {
        // Mark as executed
        _timelockOperations[operationId].executed = true;
        
        emit OperationExecuted(operationId, msg.sender);
    }
}