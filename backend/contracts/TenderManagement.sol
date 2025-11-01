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
     * Accept a bid and award tender to contractor
     * This creates a contract entry
     */
    function acceptBidAndAwardTender(
        uint256 _bidId,
        uint256 _contractValue,
        uint256 _startDate,
        uint256 _endDate
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
            status: ContractStatus.Active
        });
        
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
}

