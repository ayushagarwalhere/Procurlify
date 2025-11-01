import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useContract } from "../hooks/useContract";
import { supabase } from "../lib/supabase";

const CreateTender = () => {
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  const { createTender: createTenderOnChain, error: contractError, isInitialized } = useContract();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("0");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [bidStartDate, setBidStartDate] = useState("");
  const [bidStartTime, setBidStartTime] = useState("");
  const [bidEndDate, setBidEndDate] = useState("");
  const [bidEndTime, setBidEndTime] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const categories = [
    { value: "0", label: "Infrastructure" },
    { value: "1", label: "Education" },
    { value: "2", label: "Health" },
    { value: "3", label: "Finance" },
    { value: "4", label: "Rural Development" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isInitialized) {
      setError("Smart contract not initialized. Please check your connection.");
      return;
    }

    // Validation
    if (!title || !description || !estimatedBudget || !bidStartDate || !bidStartTime || !bidEndDate || !bidEndTime) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Creating tender on blockchain...");

    try {
      // Parse dates and times
      const bidStartTimestamp = new Date(`${bidStartDate}T${bidStartTime}`).getTime();
      const bidEndTimestamp = new Date(`${bidEndDate}T${bidEndTime}`).getTime();

      // Validate dates
      // if (bidStartTimestamp < Date.now()) {
      //   throw new Error("Bid start time must be in the future");
      // }

      // if (bidEndTimestamp <= bidStartTimestamp) {
      //   throw new Error("Bid end time must be after start time");
      // }

      setStatus("Step 1/3: Deploying tender smart contract...");
      const blockchainReceipt = await createTenderOnChain(
        title,
        description,
        category,
        estimatedBudget,
        bidStartTimestamp,
        bidEndTimestamp
      );

      console.log("Blockchain receipt:", blockchainReceipt);

      // Extract tender ID from event logs
      let tenderId = null;
      if (blockchainReceipt.logs && blockchainReceipt.logs.length > 0) {
        // TenderCreated event signature
        const eventSignature = ethers.id("TenderCreated(uint256,address,string,uint256,uint256,uint256)");
        
        // Parse event logs to find TenderCreated
        for (const log of blockchainReceipt.logs) {
          if (log.topics && log.topics[0] === eventSignature) {
            // Decode the log using ethers
            const iface = new ethers.Interface([
              "event TenderCreated(uint256 indexed tenderId, address indexed createdBy, string title, uint256 estimatedBudget, uint256 bidStartTime, uint256 bidEndTime)"
            ]);
            try {
              const parsed = iface.parseLog(log);
              tenderId = Number(parsed.args.tenderId);
              break;
            } catch (e) {
              console.error("Error parsing event:", e);
            }
          }
        }
      }

      // Step 2: Get current user from Supabase
      setStatus("Step 2/3: Saving tender details to database...");
      const { data: userResponse, error: userError } = await supabase.auth.getUser();

      if (userError || !userResponse?.user?.id) {
        console.error("Failed to fetch user details:", userError || "User ID is undefined");
        throw new Error("You must be logged in to create a tender.");
      }

      const userId = userResponse.user.id; // Extract the user ID
      console.log("Fetched user ID:", userId); // Debugging: Log the user ID

      // Step 3: Save to Supabase database
      const tenderData = {
        title,
        description,
        category: categories.find(c => c.value === category)?.label || "Infrastructure",
        estimated_budget: parseFloat(estimatedBudget),
        bid_start_date: new Date(bidStartTimestamp).toISOString(),
        closing_date: new Date(bidEndTimestamp).toISOString(),
        opening_date: new Date(bidStartTimestamp).toISOString(), // For backward compatibility
        created_by: userId, // Use the valid user ID
        status: 'open',
        is_allotted: false,
        blockchain_tx_hash: blockchainReceipt.hash,
        blockchain_tender_id: tenderId
      };

      const { data: dbTender, error: dbError } = await supabase
        .from("tenders")
        .insert([tenderData])
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        // Still show success if blockchain deployment worked
        setStatus("✅ Tender created on blockchain but database save failed. Tender ID: " + tenderId);
        setTimeout(() => navigate("/dashboard/admin"), 3000);
        return;
      }

      setStatus("✅ Tender created successfully!");
      
      // Wait a moment to show success message
      setTimeout(() => {
        navigate("/dashboard/admin");
      }, 2000);

    } catch (err) {
      console.error("Error creating tender:", err);
      setError(err.message || "Failed to create tender");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard/admin")}
            className="text-white/60 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2">Create New Tender</h1>
          <p className="text-white/60">
            Create a tender that will be deployed on blockchain for transparency
          </p>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {contractError && (
          <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-300 p-4 rounded-lg mb-6">
            Contract Error: {contractError}
            <br />
            <small>Make sure your contract is deployed and VITE_CONTRACT_ADDRESS is set correctly</small>
          </div>
        )}

        {status && (
          <div className="bg-blue-600/20 border border-blue-600 text-blue-300 p-4 rounded-lg mb-6">
            {status}
          </div>
        )}

        {!isConnected && (
          <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-300 p-4 rounded-lg mb-6">
            ⚠️ Please connect your MetaMask wallet to create a tender
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Tender Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Highway Construction Project"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the project requirements, scope, deliverables..."
              rows={6}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
            />
          </div>

          {/* Category and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estimated Budget (ETH) *</label>
              <input
                type="number"
                step="0.01"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="e.g., 100.00"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Bid Start Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bid Start Date *</label>
              <input
                type="date"
                value={bidStartDate}
                onChange={(e) => setBidStartDate(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bid Start Time *</label>
              <input
                type="time"
                value={bidStartTime}
                onChange={(e) => setBidStartTime(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Bid End Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bid End Date *</label>
              <input
                type="date"
                value={bidEndDate}
                onChange={(e) => setBidEndDate(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bid End Time *</label>
              <input
                type="time"
                value={bidEndTime}
                onChange={(e) => setBidEndTime(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Blockchain Notice */}
          <div className="bg-blue-600/10 border border-blue-600/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🔗 Blockchain Integration</h3>
            <p className="text-sm text-white/80">
              This tender will be deployed on Ethereum blockchain. All data will be stored immutably,
              ensuring full transparency and auditability. Once submitted, changes cannot be made.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/admin")}
              className="flex-1 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isConnected || !isInitialized}
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Creating Tender..." : "Create Tender on Blockchain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTender;

