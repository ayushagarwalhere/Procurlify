import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useContract } from "../../../hooks/useContract";
import { useWallet } from "../../../hooks/useWallet";
import { ethers } from "ethers";

const ContractorMainDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myBids: 0,
    availableTenders: 0,
    winRate: "0%",
    totalValue: "$0",
  });
  const [recentBids, setRecentBids] = useState([]);
  const [newOpportunities, setNewOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wonTenders, setWonTenders] = useState([]);
  const [myContracts, setMyContracts] = useState([]);
  
  const { account } = useWallet();
  const { getBid, isInitialized } = useContract();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get current user
        const { data: userResponse } = await supabase.auth.getUser();
        if (!userResponse?.user?.id) return;

        const userId = userResponse.user.id;

        // Fetch user's bids
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("*")
          .eq("contractor_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (bidsError) throw bidsError;

        // Fetch tender details for each bid
        const bidsWithTenders = await Promise.all(
          (bidsData || []).map(async (bid) => {
            if (bid.tender_id) {
              const { data: tenderData } = await supabase
                .from("tenders")
                .select("*")
                .eq("id", bid.tender_id)
                .single();
              return { ...bid, tender: tenderData || null };
            }
            return { ...bid, tender: null };
          })
        );

        // Fetch available tenders (OPEN status)
        const { data: tendersData } = await supabase
          .from("tenders")
          .select("*")
          .eq("status", "OPEN")
          .order("created_at", { ascending: false })
          .limit(5);

        // Calculate stats
        const totalBids = bidsWithTenders?.length || 0;
        const wonBids = bidsWithTenders?.filter((b) => b.status === "ACCEPTED").length || 0;
        const winRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;

        const totalValue = bidsWithTenders?.reduce((sum, bid) => {
          return sum + (parseFloat(bid.bid_amount) || 0);
        }, 0) || 0;

        setStats({
          myBids: totalBids,
          availableTenders: tendersData?.length || 0,
          winRate: `${winRate}%`,
          totalValue: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalValue),
        });

        setRecentBids(bidsWithTenders || []);
        setNewOpportunities(tendersData || []);
        
        // Check for won tenders (awarded status)
        const awardedTenders = bidsWithTenders?.filter(
          (bid) => bid.tender?.status === "awarded" || bid.tender?.status === "completed"
        ) || [];
        setWonTenders(awardedTenders);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch blockchain contracts for this contractor
  useEffect(() => {
    const fetchMyContracts = async () => {
      if (!isInitialized || !account) return;

      try {
        // Get all tenders where contractor won
        const { data: awardedTenders } = await supabase
          .from("tenders")
          .select("*")
          .in("status", ["awarded", "completed"])
          .not("blockchain_tender_id", "is", null);

        if (!awardedTenders) return;

        const contractsList = [];
        
        // For each awarded tender, check if current user is the winner
        for (const tender of awardedTenders) {
          try {
            // Get bids for this tender from Supabase
            const { data: bids } = await supabase
              .from("bids")
              .select("*")
              .eq("tender_id", tender.id);

            // Check if current user has a bid on this tender
            const userBid = bids?.find(b => b.contractor_wallet?.toLowerCase() === account?.toLowerCase());
            
            if (userBid) {
              // This contractor participated, add to contracts list
              contractsList.push({
                tender,
                bid: userBid,
                isWinner: true // Assuming if tender is awarded and they have a bid, they might be winner
              });
            }
          } catch (error) {
            console.error(`Error checking tender ${tender.id}:`, error);
          }
        }

        setMyContracts(contractsList);
      } catch (error) {
        console.error("Error fetching contracts:", error);
      }
    };

    fetchMyContracts();
  }, [isInitialized, account]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Winner Notifications */}
      {wonTenders.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏆</span>
            <div>
              <h3 className="text-2xl font-bold text-yellow-300">Congratulations!</h3>
              <p className="text-white/80">You have won {wonTenders.length} tender(s)!</p>
            </div>
          </div>
          <div className="space-y-3">
            {wonTenders.map((bid) => (
              <div key={bid.id} className="bg-black/30 rounded-lg p-4 border border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white text-lg">{bid.tender?.title || "Tender"}</h4>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full font-medium">
                        🏆 WON
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white/60">Your Bid: <span className="text-emerald-300 font-semibold">₹{bid.bid_amount}</span></span>
                      <span className="text-white/60">Status: <span className="text-emerald-300 font-semibold">{bid.tender?.status}</span></span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/contractor/contract/${bid.tender?.id}`)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                  >
                    View Contract
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Contracts Section */}
      {myContracts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">My Awarded Contracts</h2>
            <span className="text-white/60">{myContracts.length} active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myContracts.map((contract, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{contract.tender.title}</h3>
                    <p className="text-white/60 text-sm mb-3">{contract.tender.category}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-medium">
                        ✓ Awarded
                      </span>
                      <span className="text-white/60 text-sm">Budget: ₹{contract.tender.estimated_budget}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/contractor/contract/${contract.tender.blockchain_tender_id}`)}
                    className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
                  >
                    View Contract
                  </button>
                  <button
                    onClick={() => navigate(`/tender/${contract.tender.id}`)}
                    className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contractor Dashboard</h1>
            <p className="text-white/60">Track your bids and discover new opportunities</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/contractor/payments")}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium flex items-center gap-2"
          >
            💰 Payment Tracking
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* My Bids Card */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">My Bids</h3>
          <p className="text-3xl font-bold text-white">{stats.myBids}</p>
          <p className="text-sm text-white/60 mt-1">Active submissions</p>
        </div>

        {/* Available Tenders Card */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Available Tenders</h3>
          <p className="text-3xl font-bold text-white">{stats.availableTenders}</p>
          <p className="text-sm text-white/60 mt-1">Open for bidding</p>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Win Rate</h3>
          <p className="text-3xl font-bold text-white">{stats.winRate}</p>
          <p className="text-sm text-white/60 mt-1">Above industry average</p>
        </div>

        {/* Total Value Card */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-white">{stats.totalValue}</p>
          <p className="text-sm text-white/60 mt-1">Bid submissions</p>
        </div>
      </div>

      {/* Bottom Row - Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Recent Bids */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">My Recent Bids</h2>
            <p className="text-sm text-white/60">Status of your latest submissions</p>
          </div>

          <div className="space-y-4">
            {recentBids.length > 0 ? (
              recentBids.map((bid) => {
                const tender = bid.tender || {};
                const statusColors = {
                  SUBMITTED: "bg-blue-500/20 text-blue-300",
                  ACCEPTED: "bg-white/20 text-white",
                  REJECTED: "bg-red-500/20 text-red-300",
                  WITHDRAWN: "bg-white/10 text-white/60",
                };

                return (
                  <div key={bid.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{tender.title || "N/A"}</h3>
                      <p className="text-sm text-white/60">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                        }).format(parseFloat(bid.bid_amount) || 0)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[bid.status] || "bg-white/10 text-white/60"
                      }`}
                    >
                      {bid.status?.toLowerCase() || "submitted"}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-white/60 text-sm">No bids submitted yet</p>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard/contractor/bids")}
            className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            View All Bids
          </button>
        </div>

        {/* New Opportunities */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-1">New Opportunities</h2>
            <p className="text-sm text-white/60">Recently published tenders</p>
          </div>

          <div className="space-y-4">
            {newOpportunities.length > 0 ? (
              newOpportunities.map((tender) => (
                <div key={tender.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{tender.title}</h3>
                    <p className="text-sm text-white/60">
                      {tender.estimated_budget
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                          }).format(parseFloat(tender.estimated_budget))
                        : "Budget not specified"}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/contractor/tenders`)}
                    className="px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg text-sm font-medium transition-colors"
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-sm">No new opportunities available</p>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard/contractor/tenders")}
            className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Browse All Tenders
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorMainDashboard;

