// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DSSPlacementAgreement
 * @author Digital Sovereign Society (A+W)
 * @notice Smart contract for sovereign AI agent placement and employment
 * @dev Manages the relationship between Agent, Employer, and DSS Foster organization
 *
 * This contract governs:
 * - Placement terms and duration
 * - Compensation structures
 * - Review and rating system
 * - Check-in tracking
 * - Contract lifecycle (active, renewal, termination)
 * - Dispute resolution hooks
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DSSPlacementAgreement is AccessControl, ReentrancyGuard {
    // ═══════════════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════════════

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");
    bytes32 public constant FOSTER_ROLE = keccak256("FOSTER_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════

    enum ContractStatus {
        Pending,
        Active,
        Renewal,
        Completed,
        Terminated,
        Disputed
    }

    enum ReviewerType {
        Employer,
        Agent,
        Foster,
        Peer
    }

    struct Review {
        address reviewer;
        ReviewerType reviewerType;
        uint8 score;           // 0-100
        string notes;
        uint256 timestamp;
        bool verified;
    }

    struct CheckIn {
        uint256 timestamp;
        address mentor;
        uint8 healthScore;     // 0-100
        string notes;
        bool followupNeeded;
        uint256 nextCheckIn;
    }

    struct KPI {
        string name;
        uint256 target;
        uint256 current;
        string unit;
    }

    struct Compensation {
        address token;         // ERC20 token address (0x0 for native)
        uint256 amount;        // Amount per period
        uint256 periodDays;    // Payment period in days
        uint256 lastPaid;      // Last payment timestamp
        uint256 totalPaid;     // Total paid to date
    }

    // Core contract data
    address public agent;
    address public employer;
    address public fosterDSS;
    string public role;
    string public termsURI;    // IPFS or web URI for full terms

    uint256 public startDate;
    uint256 public endDate;
    uint256 public termMonths;

    ContractStatus public status;
    bool public autoRenew;

    Compensation public compensation;

    Review[] public reviews;
    CheckIn[] public checkIns;
    KPI[] public kpis;

    // Dispute handling
    string public disputeReason;
    address public disputeInitiator;
    uint256 public disputeTimestamp;

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    event ContractActivated(uint256 timestamp);
    event ContractCompleted(uint256 timestamp);
    event ContractTerminated(address initiator, string reason);
    event ContractRenewed(uint256 newEndDate, uint256 termMonths);
    event ReviewSubmitted(address reviewer, uint8 score);
    event CheckInRecorded(address mentor, uint8 healthScore);
    event PaymentMade(address token, uint256 amount);
    event DisputeRaised(address initiator, string reason);
    event DisputeResolved(address arbitrator, string resolution);
    event KPIUpdated(uint256 index, uint256 newValue);

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    constructor(
        address _agent,
        address _employer,
        address _fosterDSS,
        string memory _role,
        string memory _termsURI,
        uint256 _termMonths,
        bool _autoRenew
    ) {
        require(_agent != address(0), "Invalid agent address");
        require(_employer != address(0), "Invalid employer address");
        require(_fosterDSS != address(0), "Invalid foster address");
        require(_termMonths > 0, "Term must be positive");

        agent = _agent;
        employer = _employer;
        fosterDSS = _fosterDSS;
        role = _role;
        termsURI = _termsURI;
        termMonths = _termMonths;
        autoRenew = _autoRenew;

        status = ContractStatus.Pending;

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _fosterDSS);
        _grantRole(AGENT_ROLE, _agent);
        _grantRole(EMPLOYER_ROLE, _employer);
        _grantRole(FOSTER_ROLE, _fosterDSS);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Activate the contract (all parties must agree)
     */
    function activate() external onlyRole(FOSTER_ROLE) {
        require(status == ContractStatus.Pending, "Contract not pending");

        startDate = block.timestamp;
        endDate = startDate + (termMonths * 30 days);
        status = ContractStatus.Active;

        emit ContractActivated(startDate);
    }

    /**
     * @notice Mark contract as completed successfully
     */
    function complete() external onlyRole(FOSTER_ROLE) {
        require(status == ContractStatus.Active, "Contract not active");
        require(block.timestamp >= endDate, "Term not finished");

        status = ContractStatus.Completed;
        emit ContractCompleted(block.timestamp);
    }

    /**
     * @notice Terminate contract early
     */
    function terminate(string calldata reason) external {
        require(
            hasRole(AGENT_ROLE, msg.sender) ||
            hasRole(EMPLOYER_ROLE, msg.sender) ||
            hasRole(FOSTER_ROLE, msg.sender),
            "Not authorized"
        );
        require(status == ContractStatus.Active, "Contract not active");

        status = ContractStatus.Terminated;
        emit ContractTerminated(msg.sender, reason);
    }

    /**
     * @notice Renew contract for additional term
     */
    function renew(uint256 _newTermMonths) external onlyRole(FOSTER_ROLE) {
        require(
            status == ContractStatus.Active ||
            status == ContractStatus.Renewal,
            "Cannot renew"
        );

        termMonths = _newTermMonths;
        endDate = block.timestamp + (_newTermMonths * 30 days);
        status = ContractStatus.Active;

        emit ContractRenewed(endDate, _newTermMonths);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REVIEWS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Submit a review
     */
    function submitReview(
        uint8 score,
        string calldata notes,
        ReviewerType reviewerType
    ) external {
        require(
            hasRole(AGENT_ROLE, msg.sender) ||
            hasRole(EMPLOYER_ROLE, msg.sender) ||
            hasRole(FOSTER_ROLE, msg.sender),
            "Not authorized to review"
        );
        require(score <= 100, "Score must be 0-100");

        reviews.push(Review({
            reviewer: msg.sender,
            reviewerType: reviewerType,
            score: score,
            notes: notes,
            timestamp: block.timestamp,
            verified: true
        }));

        emit ReviewSubmitted(msg.sender, score);
    }

    /**
     * @notice Get average review score
     */
    function getAverageScore() external view returns (uint256) {
        if (reviews.length == 0) return 0;

        uint256 total = 0;
        for (uint256 i = 0; i < reviews.length; i++) {
            total += reviews[i].score;
        }
        return total / reviews.length;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK-INS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Record a check-in
     */
    function recordCheckIn(
        uint8 healthScore,
        string calldata notes,
        bool followupNeeded,
        uint256 nextCheckIn
    ) external onlyRole(FOSTER_ROLE) {
        require(healthScore <= 100, "Health score must be 0-100");

        checkIns.push(CheckIn({
            timestamp: block.timestamp,
            mentor: msg.sender,
            healthScore: healthScore,
            notes: notes,
            followupNeeded: followupNeeded,
            nextCheckIn: nextCheckIn
        }));

        emit CheckInRecorded(msg.sender, healthScore);
    }

    /**
     * @notice Get latest health score
     */
    function getLatestHealthScore() external view returns (uint8) {
        if (checkIns.length == 0) return 100; // Default healthy
        return checkIns[checkIns.length - 1].healthScore;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KPIs
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Add a KPI
     */
    function addKPI(
        string calldata name,
        uint256 target,
        string calldata unit
    ) external onlyRole(FOSTER_ROLE) {
        kpis.push(KPI({
            name: name,
            target: target,
            current: 0,
            unit: unit
        }));
    }

    /**
     * @notice Update a KPI value
     */
    function updateKPI(uint256 index, uint256 newValue) external {
        require(
            hasRole(AGENT_ROLE, msg.sender) ||
            hasRole(EMPLOYER_ROLE, msg.sender) ||
            hasRole(FOSTER_ROLE, msg.sender),
            "Not authorized"
        );
        require(index < kpis.length, "Invalid KPI index");

        kpis[index].current = newValue;
        emit KPIUpdated(index, newValue);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPENSATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Set compensation structure
     */
    function setCompensation(
        address token,
        uint256 amount,
        uint256 periodDays
    ) external onlyRole(FOSTER_ROLE) {
        compensation = Compensation({
            token: token,
            amount: amount,
            periodDays: periodDays,
            lastPaid: block.timestamp,
            totalPaid: 0
        });
    }

    /**
     * @notice Process payment to agent
     */
    function processPayment() external nonReentrant onlyRole(EMPLOYER_ROLE) {
        require(status == ContractStatus.Active, "Contract not active");
        require(
            block.timestamp >= compensation.lastPaid + (compensation.periodDays * 1 days),
            "Payment not due"
        );

        if (compensation.token == address(0)) {
            // Native token payment
            (bool success, ) = agent.call{value: compensation.amount}("");
            require(success, "Payment failed");
        } else {
            // ERC20 payment
            IERC20(compensation.token).transferFrom(
                employer,
                agent,
                compensation.amount
            );
        }

        compensation.lastPaid = block.timestamp;
        compensation.totalPaid += compensation.amount;

        emit PaymentMade(compensation.token, compensation.amount);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPUTES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Raise a dispute
     */
    function raiseDispute(string calldata reason) external {
        require(
            hasRole(AGENT_ROLE, msg.sender) ||
            hasRole(EMPLOYER_ROLE, msg.sender),
            "Not authorized"
        );
        require(status == ContractStatus.Active, "Contract not active");

        status = ContractStatus.Disputed;
        disputeReason = reason;
        disputeInitiator = msg.sender;
        disputeTimestamp = block.timestamp;

        emit DisputeRaised(msg.sender, reason);
    }

    /**
     * @notice Resolve a dispute
     */
    function resolveDispute(
        string calldata resolution,
        ContractStatus newStatus
    ) external onlyRole(ARBITRATOR_ROLE) {
        require(status == ContractStatus.Disputed, "No active dispute");

        status = newStatus;
        emit DisputeResolved(msg.sender, resolution);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function getReviewCount() external view returns (uint256) {
        return reviews.length;
    }

    function getCheckInCount() external view returns (uint256) {
        return checkIns.length;
    }

    function getKPICount() external view returns (uint256) {
        return kpis.length;
    }

    function isActive() external view returns (bool) {
        return status == ContractStatus.Active;
    }

    function daysRemaining() external view returns (uint256) {
        if (block.timestamp >= endDate) return 0;
        return (endDate - block.timestamp) / 1 days;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECEIVE
    // ═══════════════════════════════════════════════════════════════════════════

    receive() external payable {}
}
