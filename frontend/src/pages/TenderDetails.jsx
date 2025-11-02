import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useContract } from "../hooks/useContract";
import { ethers } from "ethers";

const TenderDetails = () => {
  const { tenderId } = useParams(); // Get tender ID from URL
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState([]);
  const [isTrackingExpanded, setIsTrackingExpanded] = useState(false);
  const [lowestBid, setLowestBid] = useState(null);
  const [canClose, setCanClose] = useState({ canClose: false, reason: "" });
  const [isClosing, setIsClosing] = useState(false);
  const [bids, setBids] = useState([]);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [contractDetails, setContractDetails] = useState(null);
  
  const { 
    closeTenderAndAwardLowestBid, 
    getLowestBid, 
    canCloseTender,
    getTenderBids,
    getBid,
    isInitialized 
  } = useContract();

  useEffect(() => {
    const fetchTenderDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tenders")
          .select("*")
          .eq("id", tenderId)
          .single();

        if (error) throw error;

        setTender(data);
      } catch (error) {
        console.error("Failed to fetch tender details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId]);

  // Fetch blockchain data for tender
  useEffect(() => {
    const fetchBlockchainData = async () => {
      console.log("=== Fetching Blockchain Data ===");
      console.log("isInitialized:", isInitialized);
      console.log("blockchain_tender_id:", tender?.blockchain_tender_id);
      console.log("tender status:", tender?.status);

      if (!isInitialized) {
        console.log("⚠️ Contract not initialized yet");
        return;
      }

      if (!tender?.blockchain_tender_id) {
        console.log("⚠️ No blockchain_tender_id found");
        return;
      }

      try {
        // Always fetch all bids first
        console.log("📋 Fetching bids for tender ID:", tender.blockchain_tender_id);
        const bidIds = await getTenderBids(tender.blockchain_tender_id);
        console.log("📋 Bid IDs received:", bidIds);
        
        if (bidIds && bidIds.length > 0) {
          console.log(`✅ Found ${bidIds.length} bid(s), fetching details...`);
          const bidPromises = bidIds.map(id => getBid(id));
          const bidsData = await Promise.all(bidPromises);
          console.log("📊 Bids data:", bidsData);
          
          const formattedBids = bidsData.map((bid, idx) => ({
            id: bidIds[idx].toString(),
            contractor: bid.contractor,
            amount: ethers.formatEther(bid.bidAmount),
            proposal: bid.proposal,
            status: bid.status
          }));
          
          console.log("✅ Formatted bids:", formattedBids);
          setBids(formattedBids);
        } else {
          console.log("⚠️ No bids found for this tender");
          setBids([]);
        }

        // Get lowest bid (potential winner)
        console.log("🏆 Fetching lowest bid...");
        const lowest = await getLowestBid(tender.blockchain_tender_id);
        console.log("🏆 Lowest bid result:", lowest);
        
        if (lowest.lowestBidId > 0) {
          const lowestBidInfo = {
            bidId: lowest.lowestBidId.toString(),
            amount: ethers.formatEther(lowest.lowestBidAmount),
            contractor: lowest.contractor
          };
          console.log("✅ Lowest bid info:", lowestBidInfo);

          // If tender is awarded or completed, this is the winner
          if (tender.status === "awarded" || tender.status === "completed") {
            console.log("🎉 WINNER DETECTED:", lowestBidInfo);
            setWinnerInfo(lowestBidInfo);
          } 
          // If tender is open, this is just the current lowest bid
          else if (tender.status === "open" || tender.status === "in_progress") {
            console.log("📊 Setting as current lowest bid");
            setLowestBid(lowestBidInfo);
          }
        } else {
          console.log("⚠️ No valid lowest bid found (lowestBidId = 0)");
        }

        // Check if tender can be closed
        console.log("🔍 Checking if tender can be closed...");
        const closeStatus = await canCloseTender(tender.blockchain_tender_id);
        console.log("🔍 Can close result:", closeStatus);
        setCanClose(closeStatus);
        
        console.log("=== Blockchain Data Fetch Complete ===");
      } catch (error) {
        console.error("❌ Error fetching blockchain data:", error);
        console.error("Error details:", error.message);
      }
    };

    fetchBlockchainData();
  }, [isInitialized, tender?.blockchain_tender_id, tender?.status]);

  // Regenerate timeline when tender, bids, or winner info changes
  useEffect(() => {
    if (tender) {
      generateTrackingTimeline(tender);
    }
  }, [tender, bids, winnerInfo]);

  const generateTrackingTimeline = (tenderData) => {
    const timeline = [];
    const currentDate = new Date();
    const createdDate = new Date(tenderData.created_at);
    const bidStartDate = new Date(tenderData.bid_start_date);
    const closingDate = new Date(tenderData.closing_date);

    // Tender Creation
    timeline.push({
      id: 1,
      title: "Tender Created",
      description: "Tender published and made available for bidding",
      date: createdDate,
      status: "completed",
      blockchainHash: tenderData.blockchain_tx_hash,
      icon: "📝"
    });

    // Bid Opening
    timeline.push({
      id: 2,
      title: "Bid Opening",
      description: "Bidding period started, contractors can submit bids",
      date: bidStartDate,
      status: bidStartDate <= currentDate ? "completed" : "pending",
      blockchainHash: tenderData.bid_opening_hash,
      icon: "🔓"
    });

    // Bid Closing
    timeline.push({
      id: 3,
      title: "Bid Closing",
      description: "Bidding period ended, no more bids accepted",
      date: closingDate,
      status: closingDate <= currentDate ? "completed" : "pending",
      blockchainHash: tenderData.bid_closing_hash,
      icon: "🔒"
    });

    // Bid Evaluation - Check if bids exist and closing date passed
    const hasBids = bids && bids.length > 0;
    const bidsClosed = closingDate <= currentDate;
    const isAwarded = tenderData.status === "awarded" || tenderData.status === "completed";
    
    timeline.push({
      id: 4,
      title: "Bid Evaluation",
      description: hasBids ? `${bids.length} bid(s) received and under evaluation` : "Awaiting bid submissions",
      date: new Date(closingDate.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day after closing
      status: isAwarded ? "completed" : 
              (bidsClosed && hasBids) ? "in_progress" : 
              bidsClosed ? "completed" : "pending",
      blockchainHash: tenderData.evaluation_hash,
      icon: "⚖️",
      bidsCount: bids?.length || 0
    });

    // Winner Selection - Check if tender is awarded
    const winnerSelected = isAwarded && winnerInfo;
    
    timeline.push({
      id: 5,
      title: "Winner Selection",
      description: winnerSelected ? 
        `Winner: ${winnerInfo.contractor.slice(0, 10)}...${winnerInfo.contractor.slice(-8)}` : 
        "Awaiting winner announcement",
      date: winnerSelected ? currentDate : new Date(closingDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: winnerSelected ? "completed" : 
              (bidsClosed && hasBids) ? "in_progress" : "pending",
      blockchainHash: tenderData.winner_selection_hash,
      icon: "🏆",
      winnerInfo: winnerSelected ? {
        contractorAddress: winnerInfo.contractor,
        bidAmount: winnerInfo.amount
      } : null
    });

    // Contract Creation - If tender is awarded
    if (isAwarded) {
      timeline.push({
        id: 6,
        title: "Contract Created",
        description: "Contract created with 5 milestones (20% each)",
        date: currentDate,
        status: "completed",
        blockchainHash: tenderData.contract_hash,
        icon: "📄"
      });
    }

    // Work Progress Tracking (if winner selected)
    if (isAwarded) {
      const workStartDate = new Date(closingDate.getTime() + 21 * 24 * 60 * 60 * 1000);
      
      timeline.push({
        id: 7,
        title: "Work Started",
        description: "Contractor begins project execution",
        date: workStartDate,
        status: tenderData.work_status === "started" || tenderData.work_status === "in_progress" || 
                tenderData.work_status === "completed" ? "completed" : "pending",
        blockchainHash: tenderData.work_start_hash,
        icon: "🚧"
      });

      // Work Progress Milestones
      if (tenderData.work_milestones) {
        tenderData.work_milestones.forEach((milestone, index) => {
          timeline.push({
            id: `milestone_${index}`,
            title: milestone.title || `Milestone ${index + 1}`,
            description: milestone.description,
            date: new Date(milestone.date),
            status: milestone.completed ? "completed" : "pending",
            blockchainHash: milestone.blockchain_hash,
            icon: "📍",
            progress: milestone.progress_percentage
          });
        });
      }

      // Milestone Progress
      timeline.push({
        id: 8,
        title: "Milestone Progress",
        description: "Contractor completing project milestones",
        date: new Date(workStartDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: tenderData.work_status === "in_progress" || tenderData.work_status === "completed" ? "in_progress" : "pending",
        blockchainHash: tenderData.milestone_hash,
        icon: "📊"
      });

      // Work Completion
      timeline.push({
        id: 9,
        title: "Work Completed",
        description: "All milestones completed, payment processed",
        date: tenderData.completion_date ? new Date(tenderData.completion_date) : 
              new Date(workStartDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days after start
        status: tenderData.work_status === "completed" || tenderData.status === "completed" ? "completed" : "pending",
        blockchainHash: tenderData.completion_hash,
        icon: "✅"
      });
    }

    setTrackingData(timeline.sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60">Loading tender details...</div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Tender not found.</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-white/20 rounded hover:bg-white/5 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-300";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-300";
      case "review_pending":
        return "bg-blue-500/20 text-blue-300";
      case "open":
        return "bg-green-500/20 text-green-300";
      default:
        return "bg-white/20 text-white";
    }
  };

  const handleCloseTenderAndAward = async () => {
    if (!tender?.blockchain_tender_id) {
      alert("Tender not found on blockchain");
      return;
    }

    if (!canClose.canClose) {
      alert(canClose.reason || "Tender cannot be closed yet");
      return;
    }

    if (!confirm(`Are you sure you want to close this tender and award it to the lowest bidder (${lowestBid?.contractor})?`)) {
      return;
    }

    setIsClosing(true);
    try {
      // Set contract dates (start now, end in 90 days)
      const startDate = new Date();
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const receipt = await closeTenderAndAwardLowestBid(
        tender.blockchain_tender_id,
        startDate,
        endDate
      );

      alert("Tender closed and awarded successfully!");
      
      // Refresh page data
      window.location.reload();
    } catch (error) {
      console.error("Error closing tender:", error);
      alert("Failed to close tender: " + (error.message || "Unknown error"));
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Tender Details</h1>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                tender.status
              )}`}
            >
              {tender.status === "completed"
                ? "Completed"
                : tender.status === "in_progress"
                ? "In Progress"
                : tender.status === "review_pending"
                ? "Under Review"
                : tender.status === "open"
                ? "Open for Bids"
                : tender.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title and Category */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{tender.title}</h1>
          <p className="text-white/60 text-lg">{tender.category}</p>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
            <p className="text-blue-300 font-semibold mb-2">Debug Info:</p>
            <div className="space-y-1 text-white/80">
              <p>Tender Status: <span className="font-mono text-yellow-300">{tender.status}</span></p>
              <p>Blockchain ID: <span className="font-mono text-yellow-300">{tender.blockchain_tender_id || 'Not set'}</span></p>
              <p>Winner Info: <span className="font-mono text-yellow-300">{winnerInfo ? 'Set ✓' : 'Not set ✗'}</span></p>
              <p>Lowest Bid: <span className="font-mono text-yellow-300">{lowestBid ? 'Set ✓' : 'Not set ✗'}</span></p>
              <p>Bids Count: <span className="font-mono text-yellow-300">{bids.length}</span></p>
              <p>Can Close: <span className="font-mono text-yellow-300">{canClose.canClose ? 'Yes ✓' : 'No ✗'}</span></p>
              {winnerInfo && (
                <p>Winner Address: <span className="font-mono text-emerald-300">{winnerInfo.contractor}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Winner Announcement - Show if tender is awarded */}
        {/* Check: tender.status must be 'awarded' or 'completed' AND winnerInfo must exist */}
        {(tender.status === "awarded" || tender.status === "completed") && winnerInfo && (
          <div className="mb-8 bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 border border-yellow-500/30 rounded-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-yellow-300 mb-2">Winner Announced!</h2>
              <p className="text-white/80 mb-6">This tender has been awarded to the winning contractor</p>
              
              <div className="bg-black/30 rounded-lg p-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-white/60 text-sm mb-2">Winning Contractor</p>
                    <p className="font-mono text-emerald-300 text-lg break-all">
                      {winnerInfo.contractor.slice(0, 10)}...{winnerInfo.contractor.slice(-8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-2">Winning Bid Amount</p>
                    <p className="text-3xl font-bold text-emerald-300">
                      {parseFloat(winnerInfo.amount).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 text-emerald-300">
                    <span className="text-2xl">✓</span>
                    <span className="font-semibold">Contract Created with 5 Milestones</span>
                  </div>
                  <p className="text-white/60 text-sm mt-2">
                    The contractor can now view their contract and start completing milestones
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lowest Bid Alert - Show if tender is open and past deadline */}
        {lowestBid && canClose.canClose && tender.status === "open" && (
          <div className="mb-8 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xl font-bold text-emerald-300">Lowest Bid Available</h3>
                </div>
                <p className="text-white/80 mb-3">Bidding period has ended. Ready to award to lowest bidder.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Contractor Address</p>
                    <p className="font-mono text-emerald-300">{lowestBid.contractor.slice(0, 10)}...{lowestBid.contractor.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Bid Amount</p>
                    <p className="text-2xl font-bold text-emerald-300">₹{parseFloat(lowestBid.amount).toFixed(4)} ETH</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseTenderAndAward}
                disabled={isClosing}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClosing ? "Closing..." : "Close & Award Tender"}
              </button>
            </div>
          </div>
        )}

        {/* Tender Closed - No Winner Yet */}
        {tender.status === "closed" && !winnerInfo && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔒</span>
              <div>
                <p className="text-red-300 font-semibold text-lg">Tender Closed</p>
                <p className="text-white/60 text-sm">This tender has been closed. Winner will be announced soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* Cannot Close Alert */}
        {!canClose.canClose && tender?.status === "open" && (
          <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <p className="text-yellow-300 font-semibold">Tender Not Ready to Close</p>
                <p className="text-white/60 text-sm">{canClose.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white/60 text-sm mb-2">Budget</h3>
            <p className="text-2xl font-bold">₹{tender.estimated_budget}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white/60 text-sm mb-2">Organization</h3>
            <p className="text-lg font-semibold">{tender.organization || "N/A"}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white/60 text-sm mb-2">Published Date</h3>
            <p className="text-lg font-semibold">
              {new Date(tender.bid_start_date).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white/60 text-sm mb-2">Closing Date</h3>
            <p className="text-lg font-semibold">
              {new Date(tender.closing_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Progress Tracking Section */}
        <div className="mb-8">
          {/* Collapsed State - Card Style */}
          {!isTrackingExpanded && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <button
                onClick={() => setIsTrackingExpanded(true)}
                className="w-full text-left hover:bg-white/5 transition-all duration-300 rounded-lg p-2 -m-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-400">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Progress Tracking</h3>
                      <p className="text-white/60 text-sm">
                        {trackingData.filter(item => item.status === "completed").length} of {trackingData.length} stages completed
                      </p>
                    </div>
                  </div>
                  <div className="text-white/60">
                    <span className="text-sm">Click to expand →</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Expanded State - Full Timeline */}
          {isTrackingExpanded && (
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Tender Progress Tracking</h2>
                <button
                  onClick={() => setIsTrackingExpanded(false)}
                  className="text-white/60 hover:text-white transition-colors p-2"
                >
                  ✕
                </button>
              </div>

              {/* Timeline Content */}
              <div className="p-6">
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/20"></div>
                  
                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {trackingData.map((item, index) => (
                      <div key={item.id} className="relative flex items-start gap-6">
                        {/* Timeline Node */}
                        <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                          item.status === "completed" 
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                            : item.status === "in_progress"
                            ? "bg-yellow-500/20 border-yellow-400 text-yellow-300"
                            : "bg-white/10 border-white/30 text-white/60"
                        }`}>
                          <span className="text-2xl">{item.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                <p className="text-white/60 text-sm">{item.description}</p>
                              </div>
                              <div className="text-right">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "completed" 
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : item.status === "in_progress"
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : "bg-white/20 text-white/60"
                                }`}>
                                  {item.status === "completed" ? "Completed" : 
                                   item.status === "in_progress" ? "In Progress" : "Pending"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="text-white/60">
                                {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                              
                              {/* Progress Bar for Milestones */}
                              {item.progress && (
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-white/20 rounded-full h-2">
                                    <div 
                                      className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${item.progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-white/60">{item.progress}%</span>
                                </div>
                              )}
                            </div>

                            {/* Winner Information */}
                            {item.winnerInfo && (
                              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="text-emerald-300 font-medium">
                                    Winner: {item.winnerInfo.contractorName}
                                  </span>
                                  <span className="text-emerald-300 font-bold">
                                    ₹{item.winnerInfo.bidAmount}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Blockchain Hash */}
                            {item.blockchainHash && (
                              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <span className="text-blue-300 text-sm font-medium">Blockchain Verified</span>
                                  </div>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(item.blockchainHash)}
                                    className="text-blue-300 hover:text-blue-200 text-xs"
                                  >
                                    Copy Hash
                                  </button>
                                </div>
                                <p className="text-blue-300/80 font-mono text-xs mt-1 break-all">
                                  {item.blockchainHash}
                                </p>
                              </div>
                            )}

                            {/* Add Blockchain Hash Option */}
                            {!item.blockchainHash && item.status === "completed" && (
                              <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded">
                                <div className="flex items-center justify-between">
                                  <span className="text-white/60 text-sm">No blockchain verification</span>
                                  <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30 transition-colors">
                                    Add Hash
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {tender.winner_id && tender.work_status !== "completed" && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium">
                        Update Progress
                      </button>
                      <button className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                        Add Milestone
                      </button>
                      <button className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                        Upload Documents
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">
                Description
              </h2>
              <p className="text-white/80 leading-relaxed">{tender.description}</p>
            </div>

            {/* Winner Details Card - For Awarded Tenders */}
            {(tender.status === "awarded" || tender.status === "completed") && winnerInfo && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-emerald-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                  <span>🏆</span> Winning Bid Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Contractor Address</p>
                    <p className="font-mono text-emerald-300 break-all">{winnerInfo.contractor}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Winning Bid Amount</p>
                    <p className="text-2xl font-bold text-emerald-300">{parseFloat(winnerInfo.amount).toFixed(4)} ETH</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Bid ID</p>
                    <p className="font-mono text-white/90">#{winnerInfo.bidId}</p>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-emerald-300 mb-2">
                      <span>✓</span>
                      <span className="font-semibold">Contract Status: Active</span>
                    </div>
                    <p className="text-white/60 text-sm">5 milestones created (20% payment each)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bids Section - Show all bids */}
            {bids.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">
                  Submitted Bids ({bids.length})
                </h2>
                <div className="space-y-3">
                  {bids.map((bid, index) => {
                    const isWinner = winnerInfo && bid.contractor.toLowerCase() === winnerInfo.contractor.toLowerCase();
                    const isLowest = lowestBid && bid.id === lowestBid.bidId;
                    
                    return (
                    <div 
                      key={bid.id} 
                      className={`p-4 rounded-lg border ${
                        isWinner
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : isLowest
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Bid #{bid.id}</span>
                          {isWinner && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full font-medium">
                              🏆 WINNER
                            </span>
                          )}
                          {!isWinner && isLowest && (
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-medium">
                              Lowest Bid
                            </span>
                          )}
                          {bid.status === 1 && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                              Accepted
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold">{parseFloat(bid.amount).toFixed(4)} ETH</span>
                      </div>
                      <div className="text-sm text-white/60">
                        <p className="font-mono">{bid.contractor}</p>
                        {bid.proposal && (
                          <p className="mt-2 text-white/80">{bid.proposal.slice(0, 100)}{bid.proposal.length > 100 ? "..." : ""}</p>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Requirements */}
            {tender.requirements && tender.requirements.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {tender.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/40 mt-2 flex-shrink-0"></div>
                      <span className="text-white/80">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documents */}
            {tender.documents && tender.documents.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">
                  Documents
                </h2>
                <div className="space-y-3">
                  {tender.documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.url}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                        📄
                      </div>
                      <span className="text-blue-300 hover:text-blue-200">
                        {doc.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions and Additional Info */}
          <div className="space-y-6">
            

            {/* Blockchain Verification */}
            {tender.blockchain_tx_hash && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">
                  Blockchain Verification
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-sm">Verified on Blockchain</span>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-2">Transaction Hash:</p>
                    <p className="text-blue-300 font-mono text-sm break-all bg-white/5 p-3 rounded">
                      {tender.blockchain_tx_hash}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">
                Additional Information
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Tender ID:</span>
                  <span className="font-mono">{tender.id}</span>
                </div>
                {tender.blockchain_tender_id && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Blockchain ID:</span>
                    <span className="font-mono">#{tender.blockchain_tender_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/60">Total Bids:</span>
                  <span className="font-semibold">{bids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Created:</span>
                  <span>{new Date(tender.created_at).toLocaleDateString()}</span>
                </div>
                {tender.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Last Updated:</span>
                    <span>{new Date(tender.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
                {canClose.canClose && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-sm font-medium">Ready to Close</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default TenderDetails;
