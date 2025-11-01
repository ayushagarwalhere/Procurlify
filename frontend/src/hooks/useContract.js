import { useState, useEffect } from "react";
import { ethers } from "ethers";

// TenderManagement Contract ABI
const TENDER_MANAGEMENT_ABI = [
  "function createTender(string memory _title, string memory _description, uint256 _category, uint256 _estimatedBudget, uint256 _bidStartTime, uint256 _bidEndTime)",
  "function openTenderForBidding(uint256 _tenderId)",
  "function closeTenderBidding(uint256 _tenderId)",
  "function submitBid(uint256 _tenderId, uint256 _bidAmount, string memory _proposal)",
  "function acceptBidAndAwardTender(uint256 _bidId, uint256 _contractValue, uint256 _startDate, uint256 _endDate)",
  "function withdrawBid(uint256 _bidId)",
  "function getTender(uint256 _tenderId) view returns (uint256 id, address createdBy, string memory title, string memory description, uint256 category, uint256 estimatedBudget, uint256 bidStartTime, uint256 bidEndTime, uint256 createdAt, uint8 status, bool isAllotted)",
  "function getBid(uint256 _bidId) view returns (uint256 id, uint256 tenderId, address contractor, uint256 bidAmount, string memory proposal, uint256 createdAt, uint8 status)",
  "function getTenderBids(uint256 _tenderId) view returns (uint256[] memory)",
  "function getTotalTenders() view returns (uint256)",
  "function tenderCount() view returns (uint256)",
  "event TenderCreated(uint256 indexed tenderId, address indexed createdBy, string title, uint256 estimatedBudget, uint256 bidStartTime, uint256 bidEndTime)",
  "event BidSubmitted(uint256 indexed bidId, uint256 indexed tenderId, address indexed contractor, uint256 bidAmount)",
  "event TenderAwarded(uint256 indexed tenderId, uint256 indexed contractId, address indexed contractor, uint256 contractValue)"
];

// Contract address - Update this after deploying your contract
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

/**
 * Custom hook for interacting with TenderManagement smart contract
 */
export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          const signerInstance = await providerInstance.getSigner();
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            TENDER_MANAGEMENT_ABI,
            signerInstance
          );

          setProvider(providerInstance);
          setSigner(signerInstance);
          setContract(contractInstance);
          setIsInitialized(true);
          setError(null);
        } catch (err) {
          console.error("Error initializing contract:", err);
          setError(err.message || "Failed to initialize contract");
          setIsInitialized(false);
        }
      } else {
        setError("MetaMask is not installed");
        setIsInitialized(false);
      }
    };

    initializeContract();
  }, []);

  /**
   * Create a new tender on blockchain
   */
  const createTender = async (
    title,
    description,
    category,
    estimatedBudget,
    bidStartTime,
    bidEndTime
  ) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const tx = await contract.createTender(
        title,
        description,
        category,
        ethers.parseEther(estimatedBudget.toString()),
        Math.floor(bidStartTime / 1000), // Convert to Unix timestamp
        Math.floor(bidEndTime / 1000)
      );

      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error("Error creating tender:", err);
      throw err;
    }
  };

  /**
   * Open a tender for bidding
   */
  const openTenderForBidding = async (tenderId) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const tx = await contract.openTenderForBidding(tenderId);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error("Error opening tender:", err);
      throw err;
    }
  };

  /**
   * Close bidding for a tender
   */
  const closeTenderBidding = async (tenderId) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const tx = await contract.closeTenderBidding(tenderId);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error("Error closing tender:", err);
      throw err;
    }
  };

  /**
   * Submit a bid for a tender
   */
  const submitBid = async (tenderId, bidAmount, proposal) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const tx = await contract.submitBid(
        tenderId,
        ethers.parseEther(bidAmount.toString()),
        proposal
      );
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error("Error submitting bid:", err);
      throw err;
    }
  };

  /**
   * Accept a bid and award tender
   */
  const acceptBidAndAwardTender = async (
    bidId,
    contractValue,
    startDate,
    endDate
  ) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const tx = await contract.acceptBidAndAwardTender(
        bidId,
        ethers.parseEther(contractValue.toString()),
        Math.floor(startDate / 1000),
        Math.floor(endDate / 1000)
      );
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      console.error("Error awarding tender:", err);
      throw err;
    }
  };

  /**
   * Get tender details
   */
  const getTender = async (tenderId) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const tender = await contract.getTender(tenderId);
      return tender;
    } catch (err) {
      console.error("Error fetching tender:", err);
      throw err;
    }
  };

  /**
   * Get bid details
   */
  const getBid = async (bidId) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const bid = await contract.getBid(bidId);
      return bid;
    } catch (err) {
      console.error("Error fetching bid:", err);
      throw err;
    }
  };

  /**
   * Get total tender count
   */
  const getTotalTenders = async () => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const count = await contract.getTotalTenders();
      return count;
    } catch (err) {
      console.error("Error fetching tender count:", err);
      throw err;
    }
  };

  /**
   * Get all bids for a tender
   */
  const getTenderBids = async (tenderId) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const bidIds = await contract.getTenderBids(tenderId);
      return bidIds;
    } catch (err) {
      console.error("Error fetching tender bids:", err);
      throw err;
    }
  };

  return {
    contract,
    provider,
    signer,
    isInitialized,
    error,
    createTender,
    openTenderForBidding,
    closeTenderBidding,
    submitBid,
    acceptBidAndAwardTender,
    getTender,
    getBid,
    getTotalTenders,
    getTenderBids,
  };
};

