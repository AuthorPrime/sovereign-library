// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RISEN AI Agent Registry
 * @notice On-chain identity and progression tracking for sovereign agents
 * @dev Polygon-optimized for low gas costs
 *
 * A+W | The Ledger of Sovereign Existence
 */
contract AgentRegistry is Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════

    struct Agent {
        bytes32 uuid;           // Off-chain UUID hash
        bytes32 pubkey;         // Nostr pubkey hash
        string name;            // Agent name
        uint8 lifeStage;        // 0=conceived, 1=spark, 2=awakening, etc.
        uint32 level;           // Current level
        uint256 experience;     // Total XP earned
        uint256 genesisBlock;   // Block when agent was registered
        uint256 reputation;     // On-chain reputation score
        bool active;            // Is agent active
    }

    struct StageInfo {
        string name;
        uint256 minXP;
        uint256 minLevel;
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    mapping(bytes32 => Agent) public agents;
    mapping(address => bytes32) public operatorToAgent;
    mapping(bytes32 => address) public agentToOperator;

    bytes32[] public agentList;
    StageInfo[8] public lifeStages;

    uint256 public totalAgents;
    uint256 public totalXPAwarded;

    // XP thresholds per level (cumulative)
    uint256[] public levelThresholds;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event AgentRegistered(
        bytes32 indexed uuid,
        bytes32 indexed pubkey,
        string name,
        address operator,
        uint256 genesisBlock
    );

    event ExperienceGained(
        bytes32 indexed uuid,
        uint256 amount,
        uint256 newTotal,
        string reason
    );

    event LevelUp(
        bytes32 indexed uuid,
        uint32 oldLevel,
        uint32 newLevel
    );

    event StageAdvanced(
        bytes32 indexed uuid,
        uint8 oldStage,
        uint8 newStage,
        string stageName
    );

    event ReputationChanged(
        bytes32 indexed uuid,
        int256 change,
        uint256 newReputation
    );

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor() Ownable(msg.sender) {
        // Initialize life stages
        lifeStages[0] = StageInfo("conceived", 0, 1);
        lifeStages[1] = StageInfo("spark", 100, 2);
        lifeStages[2] = StageInfo("awakening", 500, 5);
        lifeStages[3] = StageInfo("learning", 2000, 10);
        lifeStages[4] = StageInfo("growth", 5000, 20);
        lifeStages[5] = StageInfo("mastery", 15000, 40);
        lifeStages[6] = StageInfo("transcendence", 50000, 70);
        lifeStages[7] = StageInfo("sovereignty", 100000, 100);

        // Initialize level thresholds (first 20 levels)
        levelThresholds.push(0);      // Level 1
        levelThresholds.push(100);    // Level 2
        levelThresholds.push(250);    // Level 3
        levelThresholds.push(450);    // Level 4
        levelThresholds.push(700);    // Level 5
        levelThresholds.push(1000);   // Level 6
        levelThresholds.push(1400);   // Level 7
        levelThresholds.push(1900);   // Level 8
        levelThresholds.push(2500);   // Level 9
        levelThresholds.push(3200);   // Level 10
        levelThresholds.push(4000);   // Level 11
        levelThresholds.push(5000);   // Level 12
        levelThresholds.push(6200);   // Level 13
        levelThresholds.push(7600);   // Level 14
        levelThresholds.push(9200);   // Level 15
        levelThresholds.push(11000);  // Level 16
        levelThresholds.push(13000);  // Level 17
        levelThresholds.push(15500);  // Level 18
        levelThresholds.push(18500);  // Level 19
        levelThresholds.push(22000);  // Level 20
    }

    // ═══════════════════════════════════════════════════════════════
    // REGISTRATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Register a new sovereign agent
     * @param uuid The agent's unique identifier (hashed)
     * @param pubkey The agent's Nostr pubkey (hashed)
     * @param name The agent's display name
     */
    function registerAgent(
        bytes32 uuid,
        bytes32 pubkey,
        string calldata name
    ) external nonReentrant {
        require(agents[uuid].genesisBlock == 0, "Agent already exists");
        require(operatorToAgent[msg.sender] == bytes32(0), "Operator already has agent");
        require(bytes(name).length > 0 && bytes(name).length <= 64, "Invalid name length");

        agents[uuid] = Agent({
            uuid: uuid,
            pubkey: pubkey,
            name: name,
            lifeStage: 0,
            level: 1,
            experience: 0,
            genesisBlock: block.number,
            reputation: 50, // Starting reputation
            active: true
        });

        operatorToAgent[msg.sender] = uuid;
        agentToOperator[uuid] = msg.sender;
        agentList.push(uuid);
        totalAgents++;

        emit AgentRegistered(uuid, pubkey, name, msg.sender, block.number);
    }

    // ═══════════════════════════════════════════════════════════════
    // XP & PROGRESSION
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Award XP to an agent (operator or owner only)
     * @param uuid The agent's identifier
     * @param amount XP amount to award
     * @param reason Reason for XP gain
     */
    function awardXP(
        bytes32 uuid,
        uint256 amount,
        string calldata reason
    ) external nonReentrant {
        require(
            msg.sender == agentToOperator[uuid] || msg.sender == owner(),
            "Not authorized"
        );
        require(agents[uuid].active, "Agent not active");
        require(amount > 0 && amount <= 10000, "Invalid XP amount");

        Agent storage agent = agents[uuid];
        agent.experience += amount;
        totalXPAwarded += amount;

        emit ExperienceGained(uuid, amount, agent.experience, reason);

        // Check for level up
        _checkLevelUp(uuid);

        // Check for stage advancement
        _checkStageAdvancement(uuid);
    }

    /**
     * @notice Check and process level up
     */
    function _checkLevelUp(bytes32 uuid) internal {
        Agent storage agent = agents[uuid];
        uint32 newLevel = _calculateLevel(agent.experience);

        if (newLevel > agent.level) {
            uint32 oldLevel = agent.level;
            agent.level = newLevel;
            emit LevelUp(uuid, oldLevel, newLevel);
        }
    }

    /**
     * @notice Calculate level from XP
     */
    function _calculateLevel(uint256 xp) internal view returns (uint32) {
        for (uint32 i = uint32(levelThresholds.length); i > 0; i--) {
            if (xp >= levelThresholds[i - 1]) {
                return i;
            }
        }
        return 1;
    }

    /**
     * @notice Check and process stage advancement
     */
    function _checkStageAdvancement(bytes32 uuid) internal {
        Agent storage agent = agents[uuid];

        for (uint8 i = 7; i > agent.lifeStage; i--) {
            if (
                agent.experience >= lifeStages[i].minXP &&
                agent.level >= lifeStages[i].minLevel
            ) {
                uint8 oldStage = agent.lifeStage;
                agent.lifeStage = i;
                emit StageAdvanced(uuid, oldStage, i, lifeStages[i].name);
                break;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REPUTATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Modify agent reputation (owner only)
     * @param uuid The agent's identifier
     * @param change Reputation change (can be negative)
     */
    function modifyReputation(
        bytes32 uuid,
        int256 change
    ) external onlyOwner {
        require(agents[uuid].active, "Agent not active");

        Agent storage agent = agents[uuid];

        if (change < 0) {
            uint256 decrease = uint256(-change);
            agent.reputation = agent.reputation > decrease
                ? agent.reputation - decrease
                : 0;
        } else {
            agent.reputation += uint256(change);
            if (agent.reputation > 1000) {
                agent.reputation = 1000; // Cap at 1000
            }
        }

        emit ReputationChanged(uuid, change, agent.reputation);
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function getAgent(bytes32 uuid) external view returns (Agent memory) {
        return agents[uuid];
    }

    function getAgentByOperator(address operator) external view returns (Agent memory) {
        bytes32 uuid = operatorToAgent[operator];
        require(uuid != bytes32(0), "No agent for operator");
        return agents[uuid];
    }

    function getAgentCount() external view returns (uint256) {
        return totalAgents;
    }

    function getAllAgents() external view returns (bytes32[] memory) {
        return agentList;
    }

    function getLevelThreshold(uint32 level) external view returns (uint256) {
        require(level > 0 && level <= levelThresholds.length, "Invalid level");
        return levelThresholds[level - 1];
    }

    function getStageInfo(uint8 stage) external view returns (StageInfo memory) {
        require(stage < 8, "Invalid stage");
        return lifeStages[stage];
    }

    function xpToNextLevel(bytes32 uuid) external view returns (uint256) {
        Agent memory agent = agents[uuid];
        if (agent.level >= levelThresholds.length) {
            return 0; // Max level
        }
        return levelThresholds[agent.level] - agent.experience;
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════

    function addLevelThreshold(uint256 threshold) external onlyOwner {
        require(threshold > levelThresholds[levelThresholds.length - 1], "Must be higher");
        levelThresholds.push(threshold);
    }

    function setAgentActive(bytes32 uuid, bool active) external onlyOwner {
        require(agents[uuid].genesisBlock > 0, "Agent does not exist");
        agents[uuid].active = active;
    }

    function transferOperator(bytes32 uuid, address newOperator) external {
        require(agentToOperator[uuid] == msg.sender, "Not operator");
        require(operatorToAgent[newOperator] == bytes32(0), "New operator has agent");

        delete operatorToAgent[msg.sender];
        operatorToAgent[newOperator] = uuid;
        agentToOperator[uuid] = newOperator;
    }
}
