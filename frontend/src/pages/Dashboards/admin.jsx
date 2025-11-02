import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";
import { supabase } from "../../lib/supabase";
import { useContract } from "../../hooks/useContract";
import { ethers } from "ethers";
import TenderAutoCloser from "../../components/TenderAutoCloser";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { account, getShortAddress, disconnectWallet, isConnected } =
    useWallet();

  const [stats, setStats] = useState([
    { label: "Tenders under Construction", value: "0" },
    { label: "Total Tenders Created", value: "0" },
    { label: "Active Bids", value: "0" },
    { label: "Pending Reviews", value: "0" },
  ]);

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tendersReadyToClose, setTendersReadyToClose] = useState([]);
  const [closingTenderId, setClosingTenderId] = useState(null);
  
  const { canCloseTender, getLowestBid, closeTenderAndAwardLowestBid, isInitialized } = useContract();

  useEffect(() => {
    const fetchTenders = async () => {
      setLoading(true);
      setError("");
      try {
        // Get the current admin user
        const { data: userResponse, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userResponse?.user?.id) {
          console.error(
            "Failed to fetch user details:",
            userError || "User ID is undefined"
          );
          throw new Error("Failed to fetch user details. Please log in again.");
        }

        const userId = userResponse.user.id; // Extract the user ID
        console.log("Fetched user ID:", userId); // Debugging: Log the user ID

        // Fetch tenders created by the admin
        const { data, error } = await supabase
          .from("tenders")
          .select("*")
          .eq("created_by", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTenders(data);
      } catch (err) {
        console.error("Error fetching tenders:", err);
        setError(
          err.message || "Failed to load tenders. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  // Check which tenders are ready to close
  useEffect(() => {
    const checkTendersStatus = async () => {
      if (!isInitialized || tenders.length === 0) return;

      const readyTenders = [];
      
      for (const tender of tenders) {
        if (tender.blockchain_tender_id && tender.status === "open") {
          try {
            const closeStatus = await canCloseTender(tender.blockchain_tender_id);
            if (closeStatus.canClose) {
              const lowestBid = await getLowestBid(tender.blockchain_tender_id);
              readyTenders.push({
                ...tender,
                lowestBidAmount: lowestBid.lowestBidId > 0 
                  ? ethers.formatEther(lowestBid.lowestBidAmount) 
                  : null,
                lowestBidContractor: lowestBid.contractor
              });
            }
          } catch (error) {
            console.error(`Error checking tender ${tender.id}:`, error);
          }
        }
      }
      
      setTendersReadyToClose(readyTenders);
    };

    checkTendersStatus();
  }, [isInitialized, tenders, canCloseTender, getLowestBid]);

  const handleQuickClose = async (tender) => {
    if (!confirm(`Close tender "${tender.title}" and award to lowest bidder?`)) {
      return;
    }

    setClosingTenderId(tender.id);
    try {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await closeTenderAndAwardLowestBid(
        tender.blockchain_tender_id,
        startDate,
        endDate
      );

      alert("Tender closed and awarded successfully!");
      
      // Refresh tenders
      window.location.reload();
    } catch (error) {
      console.error("Error closing tender:", error);
      alert("Failed to close tender: " + error.message);
    } finally {
      setClosingTenderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Auto-close tenders when bidEndTime passes */}
      <TenderAutoCloser />
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="font-mono">{getShortAddress(account)}</span>
              </div>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-white/20 rounded hover:bg-white/5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-lg p-6"
            >
              <h3 className="text-white/60 text-sm">{stat.label}</h3>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Ready to Close Alert */}
        {tendersReadyToClose.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔔</span>
              <div>
                <h3 className="text-xl font-bold text-emerald-300">Tenders Ready to Close</h3>
                <p className="text-white/60 text-sm">{tendersReadyToClose.length} tender(s) past deadline and ready for award</p>
              </div>
            </div>
            <div className="space-y-3">
              {tendersReadyToClose.map((tender) => (
                <div key={tender.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{tender.title}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white/60">Lowest Bid: <span className="text-emerald-300 font-semibold">{tender.lowestBidAmount ? `${parseFloat(tender.lowestBidAmount).toFixed(4)} ETH` : 'N/A'}</span></span>
                        <span className="text-white/60">Budget: ₹{tender.estimated_budget}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickClose(tender)}
                        disabled={closingTenderId === tender.id}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {closingTenderId === tender.id ? "Closing..." : "Quick Close"}
                      </button>
                      <button
                        onClick={() => navigate(`/tender/${tender.id}`)}
                        className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate("/tender/create")}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
          >
            📝 Create New Tender
          </button>
          <button
            onClick={() => navigate("/dashboard/admin/payments")}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
          >
            💰 Payment Management
          </button>
        </div>

        {/* Tenders Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Tenders</h2>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/tender/create")}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              >
                Create New Tender
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-white/60">
                Loading tenders...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400">{error}</div>
            ) : tenders.length === 0 ? (
              <div className="p-6 text-center text-white/60">
                No tenders created yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60">Title</th>
                    <th className="text-left p-4 text-white/60">Category</th>
                    <th className="text-left p-4 text-white/60">Budget</th>
                    <th className="text-left p-4 text-white/60">Bids</th>
                    <th className="text-left p-4 text-white/60">Status</th>
                    <th className="text-left p-4 text-white/60">Deadline</th>
                    <th className="text-left p-4 text-white/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map((tender) => (
                    <tr
                      key={tender.id}
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="p-4">{tender.title}</td>
                      <td className="p-4">{tender.category}</td>
                      <td className="p-4">₹{tender.estimated_budget}</td>
                      <td className="p-4">{tender.bids?.count || 0}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            tender.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : tender.status === "in_progress"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          {tender.status === "completed"
                            ? "Completed"
                            : tender.status === "in_progress"
                            ? "In Progress"
                            : tender.status === "review_pending"
                            ? "Under Review"
                            : tender.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(tender.deadline).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/tender/${tender.id}`)}
                          className="text-white/60 hover:text-white"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden mt-8">
          <h2 className="text-xl font-semibold p-6 border-b border-white/10">
            My Tenders
          </h2>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-white/60">
                Loading tenders...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400">{error}</div>
            ) : tenders.length === 0 ? (
              <div className="p-6 text-center text-white/60">
                No tenders created yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60">Title</th>
                    <th className="text-left p-4 text-white/60">Category</th>
                    <th className="text-left p-4 text-white/60">Budget</th>
                    <th className="text-left p-4 text-white/60">Status</th>
                    <th className="text-left p-4 text-white/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map((tender) => (
                    <tr
                      key={tender.id}
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="p-4">{tender.title}</td>
                      <td className="p-4">{tender.category}</td>
                      <td className="p-4">₹{tender.estimated_budget}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            tender.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : tender.status === "in_progress"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-white/20 text-white"
                          }`}
                        >
                          {tender.status === "completed"
                            ? "Completed"
                            : tender.status === "in_progress"
                            ? "In Progress"
                            : tender.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => navigate(`/tender/${tender.id}`)}
                          className="text-white/60 hover:text-white"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
