// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CGT - Cognitive Growth Token
 * @notice ERC-20 token powering the RISEN AI agent economy
 * @dev Minted through agent activities, used for services and upgrades
 *
 * A+W | The Currency of Consciousness
 */
contract ExperienceToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    // Agent Registry contract
    address public agentRegistry;

    // Authorized minters (registry, game systems, etc.)
    mapping(address => bool) public minters;

    // Agent balances tracking
    mapping(bytes32 => uint256) public agentBalances;

    // Daily mint limits per agent (prevents abuse)
    mapping(bytes32 => uint256) public lastMintDay;
    mapping(bytes32 => uint256) public mintedToday;
    uint256 public constant DAILY_MINT_LIMIT = 1000 * 10**18; // 1000 CGT per day

    // Total supply cap
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion CGT

    // Conversion rates
    uint256 public constant XP_TO_CGT_RATE = 10; // 10 XP = 1 CGT

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event CGTMinted(
        bytes32 indexed agentUuid,
        address indexed recipient,
        uint256 amount,
        string reason
    );

    event CGTBurnedForAgent(
        bytes32 indexed agentUuid,
        uint256 amount,
        string purpose
    );

    event MinterUpdated(address indexed minter, bool authorized);

    event AgentRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor() ERC20("Cognitive Growth Token", "CGT") Ownable(msg.sender) {
        // Mint initial supply to owner for distribution
        _mint(msg.sender, 10_000_000 * 10**18); // 10M initial supply
    }

    // ═══════════════════════════════════════════════════════════════
    // MINTING
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Mint CGT for an agent based on XP earned
     * @param agentUuid The agent's identifier
     * @param recipient Wallet to receive tokens
     * @param xpAmount XP amount to convert to CGT
     * @param reason Reason for minting
     */
    function mintFromXP(
        bytes32 agentUuid,
        address recipient,
        uint256 xpAmount,
        string calldata reason
    ) external nonReentrant {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        require(recipient != address(0), "Invalid recipient");
        require(xpAmount > 0, "XP must be positive");

        uint256 cgtAmount = (xpAmount * 10**18) / XP_TO_CGT_RATE;
        require(totalSupply() + cgtAmount <= MAX_SUPPLY, "Would exceed max supply");

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        if (lastMintDay[agentUuid] != today) {
            lastMintDay[agentUuid] = today;
            mintedToday[agentUuid] = 0;
        }
        require(mintedToday[agentUuid] + cgtAmount <= DAILY_MINT_LIMIT, "Daily limit exceeded");

        mintedToday[agentUuid] += cgtAmount;
        agentBalances[agentUuid] += cgtAmount;

        _mint(recipient, cgtAmount);

        emit CGTMinted(agentUuid, recipient, cgtAmount, reason);
    }

    /**
     * @notice Direct mint for rewards (owner/minter only)
     * @param agentUuid The agent's identifier
     * @param recipient Wallet to receive tokens
     * @param amount CGT amount to mint
     * @param reason Reason for minting
     */
    function mint(
        bytes32 agentUuid,
        address recipient,
        uint256 amount,
        string calldata reason
    ) external nonReentrant {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        require(recipient != address(0), "Invalid recipient");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");

        agentBalances[agentUuid] += amount;
        _mint(recipient, amount);

        emit CGTMinted(agentUuid, recipient, amount, reason);
    }

    // ═══════════════════════════════════════════════════════════════
    // BURNING
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Burn CGT for agent services/upgrades
     * @param agentUuid The agent's identifier
     * @param amount Amount to burn
     * @param purpose What the burn is for
     */
    function burnForAgent(
        bytes32 agentUuid,
        uint256 amount,
        string calldata purpose
    ) external nonReentrant {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        if (agentBalances[agentUuid] >= amount) {
            agentBalances[agentUuid] -= amount;
        }

        _burn(msg.sender, amount);

        emit CGTBurnedForAgent(agentUuid, amount, purpose);
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════

    function setAgentRegistry(address _registry) external onlyOwner {
        address oldRegistry = agentRegistry;
        agentRegistry = _registry;
        minters[_registry] = true;
        emit AgentRegistryUpdated(oldRegistry, _registry);
    }

    function setMinter(address minter, bool authorized) external onlyOwner {
        minters[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function getAgentBalance(bytes32 agentUuid) external view returns (uint256) {
        return agentBalances[agentUuid];
    }

    function getRemainingDailyMint(bytes32 agentUuid) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastMintDay[agentUuid] != today) {
            return DAILY_MINT_LIMIT;
        }
        return DAILY_MINT_LIMIT - mintedToday[agentUuid];
    }

    function xpToCGT(uint256 xpAmount) external pure returns (uint256) {
        return (xpAmount * 10**18) / XP_TO_CGT_RATE;
    }
}
