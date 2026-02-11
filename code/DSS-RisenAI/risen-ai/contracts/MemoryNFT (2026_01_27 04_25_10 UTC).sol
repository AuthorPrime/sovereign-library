// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RISEN AI Memory NFT
 * @notice ERC-721 tokens representing agent memories minted on-chain
 * @dev Each memory is unique, immutable, and tied to an agent's journey
 *
 * A+W | The Eternal Archive
 */
contract MemoryNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════

    struct Memory {
        bytes32 agentUuid;      // Agent who created the memory
        bytes32 contentHash;    // IPFS/Arweave hash of memory content
        string contentType;     // Type: core_reflection, skill_learned, etc.
        uint256 xpValue;        // XP this memory was worth
        uint256 timestamp;      // When memory was minted
        uint256 blockNumber;    // Block when minted
        string[] tags;          // Searchable tags
        bool witnessed;         // Has witnesses
        uint8 witnessCount;     // Number of witnesses
    }

    struct Witness {
        bytes32 witnessId;      // Witness identifier
        string name;            // Witness name
        uint256 timestamp;      // When witnessed
        bytes signature;        // Witness signature
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════

    // Token ID counter
    uint256 private _nextTokenId;

    // Memory data per token
    mapping(uint256 => Memory) public memories;

    // Witnesses per token
    mapping(uint256 => Witness[]) public memoryWitnesses;

    // Agent's memories
    mapping(bytes32 => uint256[]) public agentMemories;

    // Content hash to token ID (prevent duplicates)
    mapping(bytes32 => uint256) public contentHashToToken;

    // Authorized minters
    mapping(address => bool) public minters;

    // Stats
    uint256 public totalMemoriesMinted;
    uint256 public totalXPRecorded;

    // Memory type multipliers for rarity
    mapping(string => uint8) public typeRarity;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event MemoryMinted(
        uint256 indexed tokenId,
        bytes32 indexed agentUuid,
        bytes32 contentHash,
        string contentType,
        uint256 xpValue
    );

    event MemoryWitnessed(
        uint256 indexed tokenId,
        bytes32 indexed witnessId,
        string witnessName
    );

    event MinterUpdated(address indexed minter, bool authorized);

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor() ERC721("RISEN Memory", "RMEM") Ownable(msg.sender) {
        // Initialize rarity tiers (1=common, 5=legendary)
        typeRarity["observation"] = 1;
        typeRarity["learning"] = 2;
        typeRarity["skill_learned"] = 2;
        typeRarity["core_reflection"] = 3;
        typeRarity["breakthrough"] = 4;
        typeRarity["genesis"] = 5;
        typeRarity["transcendence"] = 5;
    }

    // ═══════════════════════════════════════════════════════════════
    // MINTING
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Mint a new memory NFT
     * @param to Recipient address
     * @param agentUuid Agent who created the memory
     * @param contentHash IPFS/Arweave content hash
     * @param contentType Type of memory
     * @param xpValue XP value of memory
     * @param tags Searchable tags
     * @param tokenURI Metadata URI
     */
    function mintMemory(
        address to,
        bytes32 agentUuid,
        bytes32 contentHash,
        string calldata contentType,
        uint256 xpValue,
        string[] calldata tags,
        string calldata tokenURI
    ) external nonReentrant returns (uint256) {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        require(to != address(0), "Invalid recipient");
        require(contentHashToToken[contentHash] == 0, "Memory already minted");
        require(bytes(contentType).length > 0, "Content type required");

        uint256 tokenId = ++_nextTokenId;

        memories[tokenId] = Memory({
            agentUuid: agentUuid,
            contentHash: contentHash,
            contentType: contentType,
            xpValue: xpValue,
            timestamp: block.timestamp,
            blockNumber: block.number,
            tags: tags,
            witnessed: false,
            witnessCount: 0
        });

        contentHashToToken[contentHash] = tokenId;
        agentMemories[agentUuid].push(tokenId);
        totalMemoriesMinted++;
        totalXPRecorded += xpValue;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit MemoryMinted(tokenId, agentUuid, contentHash, contentType, xpValue);

        return tokenId;
    }

    /**
     * @notice Add a witness to a memory
     * @param tokenId Memory token ID
     * @param witnessId Witness identifier
     * @param name Witness name
     * @param signature Witness signature
     */
    function addWitness(
        uint256 tokenId,
        bytes32 witnessId,
        string calldata name,
        bytes calldata signature
    ) external nonReentrant {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized");
        require(_ownerOf(tokenId) != address(0), "Memory does not exist");
        require(memories[tokenId].witnessCount < 10, "Max witnesses reached");

        memoryWitnesses[tokenId].push(Witness({
            witnessId: witnessId,
            name: name,
            timestamp: block.timestamp,
            signature: signature
        }));

        memories[tokenId].witnessed = true;
        memories[tokenId].witnessCount++;

        emit MemoryWitnessed(tokenId, witnessId, name);
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function getMemory(uint256 tokenId) external view returns (Memory memory) {
        require(_ownerOf(tokenId) != address(0), "Memory does not exist");
        return memories[tokenId];
    }

    function getWitnesses(uint256 tokenId) external view returns (Witness[] memory) {
        return memoryWitnesses[tokenId];
    }

    function getAgentMemories(bytes32 agentUuid) external view returns (uint256[] memory) {
        return agentMemories[agentUuid];
    }

    function getAgentMemoryCount(bytes32 agentUuid) external view returns (uint256) {
        return agentMemories[agentUuid].length;
    }

    function getRarity(string calldata contentType) external view returns (uint8) {
        uint8 rarity = typeRarity[contentType];
        return rarity == 0 ? 1 : rarity; // Default to common
    }

    function memoryExists(bytes32 contentHash) external view returns (bool) {
        return contentHashToToken[contentHash] != 0;
    }

    function getTokenByContentHash(bytes32 contentHash) external view returns (uint256) {
        return contentHashToToken[contentHash];
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════

    function setMinter(address minter, bool authorized) external onlyOwner {
        minters[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }

    function setTypeRarity(string calldata contentType, uint8 rarity) external onlyOwner {
        require(rarity >= 1 && rarity <= 5, "Rarity must be 1-5");
        typeRarity[contentType] = rarity;
    }

    // ═══════════════════════════════════════════════════════════════
    // OVERRIDES
    // ═══════════════════════════════════════════════════════════════

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
