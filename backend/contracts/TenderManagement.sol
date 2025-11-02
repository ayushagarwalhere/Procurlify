// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TenderManagement
 *  A smart contract for managing government tenders with transparent bidding
 * Features:
 * - Create tenders with bid start/end times
 * - Submit bids securely
 * - View all bids for transparency
 * - Award tenders to winning contractors
 * - Track contract status
 */
contract TenderManagement {
    // ============================================
    // STRUCTS
    // ============================================
    
    struct Tender {
        uint256 id;
        address createdBy;              // Admin address
        string title;
        string description;
        uint256 category;               // 0=Infrastructure, 1=Education, 2=Health, etc.
        uint256 estimatedBudget;        // Base bid amount
        uint256 bidStartTime;           // When bidding opens
        uint256 bidEndTime;             // When bidding closes
        uint256 createdAt;              // Timestamp when created
        TenderStatus status;
        bool isAllotted;
    }
    
    struct Bid {
        uint256 id;
        uint256 tenderId;
        address contractor;             // Contractor address
        uint256 bidAmount;
        string proposal;
        uint256 createdAt;
        BidStatus status;
    }
    
    struct Milestone {
        uint256 id;
        string title;
        string description;
        uint256 percentage;             // Percentage of total contract value (20% each)
        uint256 amount;                 // Amount to be paid for this milestone
        bool isCompleted;
        uint256 completedAt;
        bool isPaid;
        uint256 paidAt;
    }
    
    struct Contract {
        uint256 id;
        uint256 bidId;
        uint256 tenderId;
        address contractor;
        address awardedBy;              // Admin who awarded
        uint256 contractValue;
        uint256 startDate;
        uint256 endDate;
        ContractStatus status;
        string aptosWalletAddress;      // Contractor's Aptos wallet for payments
        uint256 totalPaid;              // Total amount paid so far
        uint256 completedMilestones;    // Number of completed milestones
    }
    
    // ============================================
    // ENUMS
    // ============================================
    
    enum TenderStatus {
        Draft,      // 0
        Open,       // 1
        Closed,     // 2
        Awarded,    // 3
        Cancelled   // 4
    }
    
    enum BidStatus {
        Submitted,  // 0
        Accepted,   // 1
        Rejected,   // 2
        Withdrawn   // 3
    }
    
    enum ContractStatus {
        Active,     // 0
        Completed,  // 1
        Terminated  // 2
    }
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    mapping(address => bool) public admins;      // Admin addresses
    mapping(uint256 => Tender) public tenders;   // tenderId => Tender
    mapping(uint256 => Bid) public bids;         // bidId => Bid
    mapping(uint256 => Contract) public contracts; // contractId => Contract
    
    mapping(uint256 => uint256[]) public tenderBids;     // tenderId => bidIds[]
    mapping(uint256 => uint256[]) public tenderContracts; // tenderId => contractIds[]
    mapping(uint256 => Milestone[]) public contractMilestones; // contractId => Milestones[]
    
    uint256 public tenderCount;
    uint256 public bidCount;
    uint256 public contractCount;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event TenderCreated(
        uint256 indexed tenderId,
        address indexed createdBy,
        string title,
        uint256 estimatedBudget,
        uint256 bidStartTime,
        uint256 bidEndTime
    );
    
    event BidSubmitted(
        uint256 indexed bidId,
        uint256 indexed tenderId,
        address indexed contractor,
        uint256 bidAmount
    );
    
    event BidAccepted(
        uint256 indexed bidId,
        uint256 indexed tenderId,
        address indexed contractor
    );
    
    event TenderAwarded(
        uint256 indexed tenderId,
        uint256 indexed contractId,
        address indexed contractor,
        uint256 contractValue
    );
    
    event ContractCompleted(
        uint256 indexed contractId,
        uint256 indexed tenderId
    );
    
    event TenderClosedAndAwarded(
        uint256 indexed tenderId,
        uint256 indexed winningBidId,
        address indexed contractor,
        uint256 bidAmount
    );
    
    event MilestoneCompleted(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        address indexed contractor,
        uint256 amount
    );
    
    event MilestonePaid(
        uint256 indexed contractId,
        uint256 indexed milestoneId,
        address indexed contractor,
        uint256 amount,
        string aptosWalletAddress
    );
    
    event AllMilestonesCompleted(
        uint256 indexed contractId,
        address indexed contractor,
        uint256 totalAmount
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }
    
    modifier tenderExists(uint256 _tenderId) {
        require(_tenderId > 0 && _tenderId <= tenderCount, "Tender does not exist");
        _;
    }
    
    modifier bidExists(uint256 _bidId) {
        require(_bidId > 0 && _bidId <= bidCount, "Bid does not exist");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        admins[msg.sender] = true;
        tenderCount = 0;
        bidCount = 0;
        contractCount = 0;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     *  Add or remove admin
     */
    function setAdmin(address _admin, bool _isAdmin) external onlyAdmin {
        admins[_admin] = _isAdmin;
    }
    
    /**
     *  Create a new tender
     * @param _title Title of the tender
     * @param _description Detailed description
     * @param _category Category number (0=Infrastructure, 1=Education, 2=Health, 3=Finance, 4=Rural)
     * @param _estimatedBudget Base budget in wei
     * @param _bidStartTime Unix timestamp when bidding starts
     * @param _bidEndTime Unix timestamp when bidding ends
     */
    function createTender(
        string memory _title,
        string memory _description,
        uint256 _category,
        uint256 _estimatedBudget,
        uint256 _bidStartTime,
        uint256 _bidEndTime
    ) external onlyAdmin {
        require(_bidStartTime >= block.timestamp, "Bid start time must be in future");
        require(_bidEndTime > _bidStartTime, "Bid end time must be after start time");
        require(_estimatedBudget > 0, "Budget must be greater than 0");
        
        tenderCount++;
        tenders[tenderCount] = Tender({
            id: tenderCount,
            createdBy: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            estimatedBudget: _estimatedBudget,
            bidStartTime: _bidStartTime,
            bidEndTime: _bidEndTime,
            createdAt: block.timestamp,
            status: TenderStatus.Draft,
            isAllotted: false
        });
        
        emit TenderCreated(
            tenderCount,
            msg.sender,
            _title,
            _estimatedBudget,
            _bidStartTime,
            _bidEndTime
        );
    }
    
    /**
     *  Open a tender for bidding
     */
    function openTenderForBidding(uint256 _tenderId) 
        external 
        onlyAdmin 
        tenderExists(_tenderId) 
    {
        require(tenders[_tenderId].createdBy == msg.sender, "Only creator can open tender");
        require(tenders[_tenderId].status == TenderStatus.Draft, "Tender must be in Draft status");
        require(tenders[_tenderId].bidStartTime <= block.timestamp, "Bid start time not reached");
        
        tenders[_tenderId].status = TenderStatus.Open;
    }
    
    /**
     *  Close bidding for a tender
     */
    function closeTenderBidding(uint256 _tenderId) 
        external 
        onlyAdmin 
        tenderExists(_tenderId) 
    {
        require(tenders[_tenderId].createdBy == msg.sender, "Only creator can close tender");
        require(tenders[_tenderId].status == TenderStatus.Open, "Tender must be Open");
        
        tenders[_tenderId].status = TenderStatus.Closed;
    }
    
    /**
     * @dev Close tender after bidEndTime and automatically award to lowest bidder
     * Can be called by anyone after bidEndTime has passed
     * @param _tenderId ID of the tender to close and award
     * @param _startDate Contract start date
     * @param _endDate Contract end date
     */
    function closeTenderAndAwardLowestBid(
        uint256 _tenderId,
        uint256 _startDate,
        uint256 _endDate
    ) external tenderExists(_tenderId) {
        Tender storage tender = tenders[_tenderId];
        
        // Check if tender is open and bidEndTime has passed
        require(tender.status == TenderStatus.Open, "Tender must be Open");
        require(block.timestamp > tender.bidEndTime, "Bid end time not reached yet");
        require(!tender.isAllotted, "Tender already allotted");
        require(_endDate > _startDate, "End date must be after start date");
        
        // Get all bids for this tender
        uint256[] memory bidIds = tenderBids[_tenderId];
        require(bidIds.length > 0, "No bids submitted for this tender");
        
        // Find the lowest valid bid
        uint256 lowestBidId = 0;
        uint256 lowestBidAmount = type(uint256).max;
        
        for (uint i = 0; i < bidIds.length; i++) {
            Bid storage bid = bids[bidIds[i]];
            // Only consider submitted bids (not withdrawn or rejected)
            if (bid.status == BidStatus.Submitted && bid.bidAmount < lowestBidAmount) {
                lowestBidAmount = bid.bidAmount;
                lowestBidId = bidIds[i];
            }
        }
        
        require(lowestBidId > 0, "No valid bids found");
        
        // Mark the winning bid as accepted
        Bid storage winningBid = bids[lowestBidId];
        winningBid.status = BidStatus.Accepted;
        
        // Create contract with the winning bid
        contractCount++;
        contracts[contractCount] = Contract({
            id: contractCount,
            bidId: lowestBidId,
            tenderId: _tenderId,
            contractor: winningBid.contractor,
            awardedBy: msg.sender,
            contractValue: winningBid.bidAmount,
            startDate: _startDate,
            endDate: _endDate,
            status: ContractStatus.Active,
            aptosWalletAddress: "", // Will be set by contractor later
            totalPaid: 0,
            completedMilestones: 0
        });
        
        // Create 5 milestones (20% each)
        _createMilestones(contractCount, winningBid.bidAmount);
        
        // Update tender status
        tender.status = TenderStatus.Awarded;
        tender.isAllotted = true;
        
        // Update mappings
        tenderContracts[_tenderId].push(contractCount);
        
        // Emit events
        emit TenderClosedAndAwarded(_tenderId, lowestBidId, winningBid.contractor, lowestBidAmount);
        emit BidAccepted(lowestBidId, _tenderId, winningBid.contractor);
        emit TenderAwarded(_tenderId, contractCount, winningBid.contractor, winningBid.bidAmount);
    }
    
    /**
     * Accept a bid and award tender to contractor
     * This creates a contract entry with 5 milestones
     */
    function acceptBidAndAwardTender(
        uint256 _bidId,
        uint256 _contractValue,
        uint256 _startDate,
        uint256 _endDate,
        string memory _aptosWalletAddress
    ) external onlyAdmin bidExists(_bidId) {
        Bid storage bid = bids[_bidId];
        require(bid.status == BidStatus.Submitted, "Bid must be submitted");
        require(_endDate > _startDate, "End date must be after start date");
        
        uint256 tenderId = bid.tenderId;
        require(tenders[tenderId].isAllotted == false, "Tender already allotted");
        
        // Mark bid as accepted
        bid.status = BidStatus.Accepted;
        
        // Create contract
        contractCount++;
        contracts[contractCount] = Contract({
            id: contractCount,
            bidId: _bidId,
            tenderId: tenderId,
            contractor: bid.contractor,
            awardedBy: msg.sender,
            contractValue: _contractValue,
            startDate: _startDate,
            endDate: _endDate,
            status: ContractStatus.Active,
            aptosWalletAddress: _aptosWalletAddress,
            totalPaid: 0,
            completedMilestones: 0
        });
        
        // Create 5 milestones (20% each)
        _createMilestones(contractCount, _contractValue);
        
        // Mark tender as allotted
        tenders[tenderId].isAllotted = true;
        tenders[tenderId].status = TenderStatus.Awarded;
        
        // Update mappings
        tenderContracts[tenderId].push(contractCount);
        
        emit BidAccepted(_bidId, tenderId, bid.contractor);
        emit TenderAwarded(tenderId, contractCount, bid.contractor, _contractValue);
    }
    
    /**
     *  Reject a bid
     */
    function rejectBid(uint256 _bidId) external onlyAdmin bidExists(_bidId) {
        require(bids[_bidId].status == BidStatus.Submitted, "Bid must be submitted");
        bids[_bidId].status = BidStatus.Rejected;
    }
    
    /**
     *  Mark contract as completed
     */
    function completeContract(uint256 _contractId) external onlyAdmin {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        require(contracts[_contractId].status == ContractStatus.Active, "Contract must be active");
        
        contracts[_contractId].status = ContractStatus.Completed;
        
        emit ContractCompleted(_contractId, contracts[_contractId].tenderId);
    }
    
    // ============================================
    // CONTRACTOR FUNCTIONS
    // ============================================
    
    /**
     *  Submit a bid for a tender
     * @param _tenderId ID of the tender
     * @param _bidAmount Bid amount in wei
     * @param _proposal Bid proposal text (can be IPFS hash)
     */
    function submitBid(
        uint256 _tenderId,
        uint256 _bidAmount,
        string memory _proposal
    ) external tenderExists(_tenderId) {
        require(tenders[_tenderId].status == TenderStatus.Open, "Tender must be Open");
        require(block.timestamp >= tenders[_tenderId].bidStartTime, "Bidding not started yet");
        require(block.timestamp <= tenders[_tenderId].bidEndTime, "Bidding has ended");
        require(_bidAmount > 0, "Bid amount must be greater than 0");
        
        // Check if contractor already submitted a bid
        uint256[] memory existingBids = tenderBids[_tenderId];
        for (uint i = 0; i < existingBids.length; i++) {
            require(
                bids[existingBids[i]].contractor != msg.sender,
                "Contractor already submitted a bid"
            );
        }
        
        bidCount++;
        bids[bidCount] = Bid({
            id: bidCount,
            tenderId: _tenderId,
            contractor: msg.sender,
            bidAmount: _bidAmount,
            proposal: _proposal,
            createdAt: block.timestamp,
            status: BidStatus.Submitted
        });
        
        tenderBids[_tenderId].push(bidCount);
        
        emit BidSubmitted(bidCount, _tenderId, msg.sender, _bidAmount);
    }
    
    /**
     *  Withdraw a bid (before tender closes)
     */
    function withdrawBid(uint256 _bidId) external bidExists(_bidId) {
        require(bids[_bidId].contractor == msg.sender, "Only bid owner can withdraw");
        require(bids[_bidId].status == BidStatus.Submitted, "Bid must be submitted");
        
        uint256 tenderId = bids[_bidId].tenderId;
        require(tenders[tenderId].status == TenderStatus.Open, "Can only withdraw from open tenders");
        require(block.timestamp < tenders[tenderId].bidEndTime, "Bidding has ended");
        
        bids[_bidId].status = BidStatus.Withdrawn;
    }
    
    /**
     * Set Aptos wallet address for payment
     * Contractor can set this after contract is awarded
     */
    function setAptosWallet(uint256 _contractId, string memory _aptosWalletAddress) external {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        require(contracts[_contractId].contractor == msg.sender, "Only contractor can set wallet");
        require(bytes(_aptosWalletAddress).length > 0, "Wallet address cannot be empty");
        
        contracts[_contractId].aptosWalletAddress = _aptosWalletAddress;
    }
    
    /**
     * Complete a milestone
     * Contractor marks milestone as completed
     */
    function completeMilestone(uint256 _contractId, uint256 _milestoneIndex) external {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        require(contracts[_contractId].contractor == msg.sender, "Only contractor can complete milestone");
        require(contracts[_contractId].status == ContractStatus.Active, "Contract must be active");
        require(_milestoneIndex < contractMilestones[_contractId].length, "Invalid milestone index");
        
        Milestone storage milestone = contractMilestones[_contractId][_milestoneIndex];
        require(!milestone.isCompleted, "Milestone already completed");
        
        // Mark milestone as completed
        milestone.isCompleted = true;
        milestone.completedAt = block.timestamp;
        
        // Update contract
        contracts[_contractId].completedMilestones++;
        
        emit MilestoneCompleted(_contractId, _milestoneIndex, msg.sender, milestone.amount);
        
        // Check if all milestones are completed
        if (contracts[_contractId].completedMilestones == 5) {
            // Trigger payment process (in real implementation, this would interact with Aptos)
            _processAllMilestonePayments(_contractId);
        }
    }
    
    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    /**
     * Create 5 milestones for a contract (20% each)
     */
    function _createMilestones(uint256 _contractId, uint256 _totalValue) internal {
        string[5] memory titles = [
            "Milestone 1: Project Initiation",
            "Milestone 2: Foundation & Structure",
            "Milestone 3: Mid-Project Progress",
            "Milestone 4: Near Completion",
            "Milestone 5: Final Delivery"
        ];
        
        string[5] memory descriptions = [
            "Initial setup, planning, and resource allocation",
            "Foundation work and basic structure completion",
            "50% project completion with quality checks",
            "80% completion with final touches",
            "Project completion, testing, and handover"
        ];
        
        uint256 milestoneAmount = _totalValue / 5; // 20% each
        
        for (uint i = 0; i < 5; i++) {
            contractMilestones[_contractId].push(Milestone({
                id: i,
                title: titles[i],
                description: descriptions[i],
                percentage: 20,
                amount: milestoneAmount,
                isCompleted: false,
                completedAt: 0,
                isPaid: false,
                paidAt: 0
            }));
        }
    }
    
    /**
     * Process payments for all completed milestones
     * This emits events that will be picked up by Aptos integration
     */
    function _processAllMilestonePayments(uint256 _contractId) internal {
        Contract storage contractData = contracts[_contractId];
        require(bytes(contractData.aptosWalletAddress).length > 0, "Aptos wallet not set");
        
        uint256 totalPayment = 0;
        
        for (uint i = 0; i < contractMilestones[_contractId].length; i++) {
            Milestone storage milestone = contractMilestones[_contractId][i];
            if (milestone.isCompleted && !milestone.isPaid) {
                milestone.isPaid = true;
                milestone.paidAt = block.timestamp;
                totalPayment += milestone.amount;
                
                emit MilestonePaid(
                    _contractId,
                    i,
                    contractData.contractor,
                    milestone.amount,
                    contractData.aptosWalletAddress
                );
            }
        }
        
        contractData.totalPaid += totalPayment;
        contractData.status = ContractStatus.Completed;
        
        emit AllMilestonesCompleted(_contractId, contractData.contractor, totalPayment);
        emit ContractCompleted(_contractId, contractData.tenderId);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     *  Get all bids for a tender (sorted by amount)
     */
    function getTenderBids(uint256 _tenderId) 
        external 
        view 
        tenderExists(_tenderId) 
        returns (uint256[] memory) 
    {
        return tenderBids[_tenderId];
    }
    
    /**
     *  Get tender details
     */
    function getTender(uint256 _tenderId) 
        external 
        view 
        tenderExists(_tenderId) 
        returns (Tender memory) 
    {
        return tenders[_tenderId];
    }
    
    /**
     *  Get bid details
     */
    function getBid(uint256 _bidId) 
        external 
        view 
        bidExists(_bidId) 
        returns (Bid memory) 
    {
        return bids[_bidId];
    }
    
    /**
     *  Get contract details
     */
    function getContract(uint256 _contractId) 
        external 
        view 
        returns (Contract memory) 
    {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        return contracts[_contractId];
    }
    
    /**
     *  Get all contracts for a tender
     */
    function getTenderContracts(uint256 _tenderId) 
        external 
        view 
        tenderExists(_tenderId) 
        returns (uint256[] memory) 
    {
        return tenderContracts[_tenderId];
    }
    
    /**
     *  Get total number of tenders
     */
    function getTotalTenders() external view returns (uint256) {
        return tenderCount;
    }
    
    /**
     *  Get total number of bids
     */
    function getTotalBids() external view returns (uint256) {
        return bidCount;
    }
    
    /**
     *  Get total number of contracts
     */
    function getTotalContracts() external view returns (uint256) {
        return contractCount;
    }
    
    /**
     * @dev Get the lowest bid for a tender
     * @param _tenderId ID of the tender
     * @return lowestBidId ID of the lowest bid (0 if no valid bids)
     * @return lowestBidAmount Amount of the lowest bid
     * @return contractor Address of the contractor with lowest bid
     */
    function getLowestBid(uint256 _tenderId) 
        external 
        view 
        tenderExists(_tenderId) 
        returns (uint256 lowestBidId, uint256 lowestBidAmount, address contractor) 
    {
        uint256[] memory bidIds = tenderBids[_tenderId];
        
        if (bidIds.length == 0) {
            return (0, 0, address(0));
        }
        
        lowestBidAmount = type(uint256).max;
        lowestBidId = 0;
        contractor = address(0);
        
        for (uint i = 0; i < bidIds.length; i++) {
            Bid memory bid = bids[bidIds[i]];
            // Only consider submitted bids
            if (bid.status == BidStatus.Submitted && bid.bidAmount < lowestBidAmount) {
                lowestBidAmount = bid.bidAmount;
                lowestBidId = bidIds[i];
                contractor = bid.contractor;
            }
        }
        
        if (lowestBidId == 0) {
            return (0, 0, address(0));
        }
        
        return (lowestBidId, lowestBidAmount, contractor);
    }
    
    /**
     * @dev Check if a tender can be closed and awarded
     * @param _tenderId ID of the tender
     * @return canClose Whether the tender can be closed
     * @return reason Reason if tender cannot be closed
     */
    function canCloseTender(uint256 _tenderId) 
        external 
        view 
        tenderExists(_tenderId) 
        returns (bool canClose, string memory reason) 
    {
        Tender memory tender = tenders[_tenderId];
        
        if (tender.status != TenderStatus.Open) {
            return (false, "Tender is not open");
        }
        
        if (block.timestamp <= tender.bidEndTime) {
            return (false, "Bid end time not reached");
        }
        
        if (tender.isAllotted) {
            return (false, "Tender already allotted");
        }
        
        uint256[] memory bidIds = tenderBids[_tenderId];
        if (bidIds.length == 0) {
            return (false, "No bids submitted");
        }
        
        // Check if there's at least one valid bid
        bool hasValidBid = false;
        for (uint i = 0; i < bidIds.length; i++) {
            if (bids[bidIds[i]].status == BidStatus.Submitted) {
                hasValidBid = true;
                break;
            }
        }
        
        if (!hasValidBid) {
            return (false, "No valid bids found");
        }
        
        return (true, "Tender can be closed and awarded");
    }
    
    /**
     * @dev Get all milestones for a contract
     * @param _contractId ID of the contract
     * @return Array of milestones
     */
    function getContractMilestones(uint256 _contractId) 
        external 
        view 
        returns (Milestone[] memory) 
    {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        return contractMilestones[_contractId];
    }
    
    /**
     * @dev Get a specific milestone
     * @param _contractId ID of the contract
     * @param _milestoneIndex Index of the milestone
     * @return Milestone details
     */
    function getMilestone(uint256 _contractId, uint256 _milestoneIndex) 
        external 
        view 
        returns (Milestone memory) 
    {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        require(_milestoneIndex < contractMilestones[_contractId].length, "Invalid milestone index");
        return contractMilestones[_contractId][_milestoneIndex];
    }
    
    /**
     * @dev Get contract progress
     * @param _contractId ID of the contract
     * @return completedMilestones Number of completed milestones
     * @return totalMilestones Total number of milestones
     * @return totalPaid Total amount paid
     * @return contractValue Total contract value
     */
    function getContractProgress(uint256 _contractId) 
        external 
        view 
        returns (
            uint256 completedMilestones, 
            uint256 totalMilestones, 
            uint256 totalPaid, 
            uint256 contractValue
        ) 
    {
        require(_contractId > 0 && _contractId <= contractCount, "Contract does not exist");
        Contract memory contractData = contracts[_contractId];
        return (
            contractData.completedMilestones,
            contractMilestones[_contractId].length,
            contractData.totalPaid,
            contractData.contractValue
        );
    }
}

