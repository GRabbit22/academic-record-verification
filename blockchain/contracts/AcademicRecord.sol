
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AcademicRecord {
    address public owner;

    mapping(bytes32 => bool) private registeredRecords;
    uint256 public totalRecords;

    event RecordRegistered(bytes32 indexed documentHash);

    constructor() {
        owner = msg.sender;
    }

    function registerRecord(bytes32 documentHash) external {
        require(msg.sender == owner, "Only owner can register");
        require(!registeredRecords[documentHash], "Record already registered");

        registeredRecords[documentHash] = true;
        totalRecords++;

        emit RecordRegistered(documentHash);
    }

    function verifyRecord(bytes32 documentHash) external view returns (bool) {
        return registeredRecords[documentHash];
    }
}

