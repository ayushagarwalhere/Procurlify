import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

const AvailableTenders = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        // Fetch all tenders from Supabase (not just OPEN status)
        const { data: tendersData, error: tendersError } = await supabase
          .from("tenders")
          .select("*")
          .order("created_at", { ascending: false });

        if (tendersError) throw tendersError;

        // Fetch bid counts for each tender
        const tendersWithBids = await Promise.all(
          (tendersData || []).map(async (tender) => {
            const { data: bidsData, error: bidsError } = await supabase
              .from("bids")
              .select("id")
              .eq("tender_id", tender.id);

            if (bidsError) {
              console.error("Error fetching bid count:", bidsError);
              return { ...tender, bidCount: 0 };
            }

            return { ...tender, bidCount: bidsData?.length || 0 };
          })
        );

        setTenders(tendersWithBids || []);
      } catch (error) {
        console.error("Error fetching tenders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Categories" || tender.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All Categories",
    ...new Set(tenders.map((t) => t.category).filter(Boolean)),
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatStatus = (status) => {
    if (!status) return "draft";
    return status.toLowerCase();
  };

  const getStatusColor = (status) => {
    const lowerStatus = formatStatus(status);
    switch (lowerStatus) {
      case "draft":
        return "bg-gray-600 text-white";
      case "open":
        return "bg-green-600 text-white";
      case "closed":
        return "bg-orange-600 text-white";
      case "awarded":
        return "bg-blue-600 text-white";
      case "cancelled":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Tenders</h1>
        <p className="text-white/60">Browse all available tenders</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search tenders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder:text-white/40"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-black">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tenders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading tenders...</div>
        </div>
      ) : filteredTenders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white text-lg">No tenders available</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Budget</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Bids</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Deadline</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{tender.title || "N/A"}</td>
                    <td className="px-6 py-4 text-white/80">{tender.category || "N/A"}</td>
                    <td className="px-6 py-4 text-white">{formatCurrency(tender.estimated_budget)}</td>
                    <td className="px-6 py-4 text-white">{tender.bidCount || 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          tender.status
                        )}`}
                      >
                        {formatStatus(tender.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/80">
                      {formatDate(tender.bid_end_date || tender.closing_date)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/dashboard/contractor/submit-bid/${tender.id}`)}
                        className="px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg text-sm font-medium transition-colors"
                      >
                        Submit Bid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableTenders;

