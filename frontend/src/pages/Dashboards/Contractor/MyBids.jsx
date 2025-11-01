import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

const MyBids = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  const [stats, setStats] = useState({
    totalBids: 0,
    wonBids: 0,
    underEvaluation: 0,
    totalValue: "$0",
  });

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (!userResponse?.user?.id) return;

        const userId = userResponse.user.id;

        const { data: bidsData, error } = await supabase
          .from("bids")
          .select("*")
          .eq("contractor_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

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

        setBids(bidsWithTenders || []);

        // Calculate stats
        const totalBids = bidsWithTenders?.length || 0;
        const wonBids = bidsWithTenders?.filter((b) => b.status === "ACCEPTED").length || 0;
        const underEvaluation =
          bidsWithTenders?.filter((b) => b.status === "SUBMITTED").length || 0;

        const totalValue = bidsWithTenders?.reduce((sum, bid) => {
          return sum + (parseFloat(bid.bid_amount) || 0);
        }, 0) || 0;

        setStats({
          totalBids,
          wonBids,
          underEvaluation,
          totalValue: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalValue),
        });
      } catch (error) {
        console.error("Error fetching bids:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  const filteredBids = bids.filter((bid) => {
    const matchesSearch =
      bid.tender?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.proposal?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "All Status" || bid.status === selectedStatus.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    "All Status",
    "SUBMITTED",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: "bg-blue-500/20 text-blue-300",
      ACCEPTED: "bg-white/20 text-white",
      REJECTED: "bg-red-500/20 text-red-300",
      WITHDRAWN: "bg-white/10 text-white/60",
      EVALUATED: "bg-white/20 text-white", // For display purposes
    };
    return colors[status] || "bg-white/10 text-white/60";
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Bids</h1>
        <p className="text-white/60">Track the status of your submitted bids</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Bids */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Total Bids</h3>
          <p className="text-3xl font-bold text-white">{stats.totalBids}</p>
        </div>

        {/* Won Bids */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Won Bids</h3>
          <p className="text-3xl font-bold text-white">{stats.wonBids}</p>
        </div>

        {/* Under Evaluation */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Under Evaluation</h3>
          <p className="text-3xl font-bold text-white">{stats.underEvaluation}</p>
        </div>

        {/* Total Value */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 shadow-sm">
          <h3 className="text-sm text-white/60 mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-white">{stats.totalValue}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search bids..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder:text-white/40"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status} className="bg-black">
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Bids List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading bids...</div>
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white text-lg">No bids found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBids.map((bid) => {
            const tender = bid.tender || {};
            const displayStatus = bid.status === "ACCEPTED" ? "EVALUATED" : bid.status;

            return (
              <div
                key={bid.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 shadow-sm hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {tender.title || "N/A"}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          displayStatus
                        )}`}
                      >
                        {displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {tender.category && (
                      <p className="text-sm text-white/60">{tender.category}</p>
                    )}
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      {formatCurrency(bid.bid_amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      Submitted {formatDate(bid.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      Score: {bid.status === "ACCEPTED" ? "88.5/100" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate(`/tender/${tender.id}`)}
                    className="px-6 py-2 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-colors"
                  >
                    View Tender
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBids;

