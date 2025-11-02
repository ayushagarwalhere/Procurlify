import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContract } from "../../../hooks/useContract";
import { ethers } from "ethers";
import { isValidAptosAddress } from "../../../utils/aptosIntegration";

const MyContract = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const {
    getContractDetails,
    getContractMilestones,
    getContractProgress,
    setAptosWallet,
    completeMilestone,
    isInitialized,
  } = useContract();

  const [contract, setContract] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aptosWalletInput, setAptosWalletInput] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [processingMilestone, setProcessingMilestone] = useState(null);

  useEffect(() => {
    const fetchContractData = async () => {
      if (!isInitialized || !contractId) return;

      try {
        setLoading(true);
        const [contractData, milestonesData, progressData] = await Promise.all([
          getContractDetails(contractId),
          getContractMilestones(contractId),
          getContractProgress(contractId),
        ]);

        setContract(contractData);
        setMilestones(milestonesData);
        setProgress(progressData);
        setAptosWalletInput(contractData.aptosWalletAddress || "");
      } catch (error) {
        console.error("Error fetching contract data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, [isInitialized, contractId, getContractDetails, getContractMilestones, getContractProgress]);

  const handleSetAptosWallet = async () => {
    if (!isValidAptosAddress(aptosWalletInput)) {
      alert("Invalid Aptos wallet address. Please enter a valid 64-character hex address.");
      return;
    }

    try {
      await setAptosWallet(contractId, aptosWalletInput);
      alert("Aptos wallet address set successfully!");
      setShowWalletModal(false);
      // Refresh contract data
      const contractData = await getContractDetails(contractId);
      setContract(contractData);
    } catch (error) {
      console.error("Error setting Aptos wallet:", error);
      alert("Failed to set Aptos wallet: " + error.message);
    }
  };

  const handleCompleteMilestone = async (milestoneIndex) => {
    if (!confirm(`Are you sure you want to mark Milestone ${milestoneIndex + 1} as completed?`)) {
      return;
    }

    try {
      setProcessingMilestone(milestoneIndex);
      await completeMilestone(contractId, milestoneIndex);
      alert("Milestone completed successfully!");
      
      // Refresh data
      const [milestonesData, progressData] = await Promise.all([
        getContractMilestones(contractId),
        getContractProgress(contractId),
      ]);
      setMilestones(milestonesData);
      setProgress(progressData);
    } catch (error) {
      console.error("Error completing milestone:", error);
      alert("Failed to complete milestone: " + error.message);
    } finally {
      setProcessingMilestone(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60">Loading contract details...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Contract not found.</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-white/20 rounded hover:bg-white/5"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = progress
    ? (parseInt(progress.completedMilestones) / parseInt(progress.totalMilestones)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-white/60 hover:text-white mb-4"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-2">My Contract</h1>
        <p className="text-white/60">Contract ID: #{contractId}</p>
      </div>

      {/* Contract Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Contract Value</h3>
          <p className="text-2xl font-bold">
            {ethers.formatEther(contract.contractValue)} ETH
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Total Paid</h3>
          <p className="text-2xl font-bold text-emerald-400">
            {ethers.formatEther(contract.totalPaid)} ETH
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Completed Milestones</h3>
          <p className="text-2xl font-bold">
            {contract.completedMilestones} / 5
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Status</h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              contract.status === 1
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-yellow-500/20 text-yellow-300"
            }`}
          >
            {contract.status === 1 ? "Completed" : "Active"}
          </span>
        </div>
      </div>

      {/* Aptos Wallet Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span>💳</span> Aptos Wallet for Payments
            </h3>
            {contract.aptosWalletAddress ? (
              <div>
                <p className="text-white/60 text-sm mb-1">Connected Wallet:</p>
                <p className="font-mono text-sm text-emerald-300 break-all">
                  {contract.aptosWalletAddress}
                </p>
              </div>
            ) : (
              <p className="text-yellow-300">
                ⚠️ Please set your Aptos wallet address to receive payments
              </p>
            )}
          </div>
          <button
            onClick={() => setShowWalletModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            {contract.aptosWalletAddress ? "Update Wallet" : "Set Wallet"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Overall Progress</h3>
          <span className="text-2xl font-bold text-emerald-400">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Project Milestones</h2>
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`border rounded-lg p-6 transition-all ${
                milestone.isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : milestone.isPaid
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        milestone.isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {milestone.isCompleted ? "✓" : index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{milestone.title}</h3>
                      <p className="text-white/60 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="ml-13 mt-3 flex items-center gap-6">
                    <div>
                      <p className="text-white/60 text-sm">Payment Amount</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {ethers.formatEther(milestone.amount)} ETH ({milestone.percentage}%)
                      </p>
                    </div>
                    {milestone.isCompleted && (
                      <div>
                        <p className="text-white/60 text-sm">Completed At</p>
                        <p className="text-sm">
                          {new Date(parseInt(milestone.completedAt) * 1000).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {milestone.isPaid && (
                      <div>
                        <p className="text-white/60 text-sm">Paid At</p>
                        <p className="text-sm text-emerald-300">
                          {new Date(parseInt(milestone.paidAt) * 1000).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {milestone.isPaid ? (
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-medium">
                      💰 Paid
                    </span>
                  ) : milestone.isCompleted ? (
                    <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg font-medium">
                      ✓ Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteMilestone(index)}
                      disabled={processingMilestone === index || index > 0 && !milestones[index - 1].isCompleted}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingMilestone === index ? "Processing..." : "Mark Complete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        {progress && parseInt(progress.completedMilestones) === 5 && (
          <div className="mt-6 p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎉</span>
              <h3 className="text-xl font-bold text-emerald-300">
                All Milestones Completed!
              </h3>
            </div>
            <p className="text-white/80 mb-3">
              Congratulations! You've completed all project milestones. The full payment will be automatically transferred to your Aptos wallet.
            </p>
            {contract.aptosWalletAddress ? (
              <div className="flex items-center gap-2 text-emerald-300">
                <span>✓</span>
                <span>Payment will be sent to: {contract.aptosWalletAddress.slice(0, 20)}...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-300">
                <span>⚠️</span>
                <span>Please set your Aptos wallet to receive payment</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aptos Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4">Set Aptos Wallet Address</h3>
            <p className="text-white/60 mb-4">
              Enter your Aptos wallet address to receive payments. This should be a 64-character hexadecimal address.
            </p>
            <input
              type="text"
              value={aptosWalletInput}
              onChange={(e) => setAptosWalletInput(e.target.value)}
              placeholder="0x1234567890abcdef..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSetAptosWallet}
                className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Save Wallet
              </button>
              <button
                onClick={() => setShowWalletModal(false)}
                className="flex-1 px-4 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyContract;
