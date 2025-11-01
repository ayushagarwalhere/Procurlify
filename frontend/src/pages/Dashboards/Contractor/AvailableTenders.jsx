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
        let query = supabase
          .from("tenders")
          .select("*")
          .eq("status", "OPEN")
          .order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        setTenders(data || []);
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Budget not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Available Tenders</h1>
        <p className="text-white/60">Browse and bid on published tenders</p>
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

      {/* Tenders List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading tenders...</div>
        </div>
      ) : filteredTenders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white text-lg">No tenders available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTenders.map((tender) => (
            <div
              key={tender.id}
              className="bg-white/5 border border-white/10 rounded-lg p-6 shadow-sm hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{tender.title}</h3>
                  <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                    Published
                  </span>
                </div>
              </div>

              {tender.category && (
                <p className="text-sm text-white/60 mb-3">{tender.category}</p>
              )}

              {tender.description && (
                <p className="text-white/80 mb-4 line-clamp-2">
                  {tender.description.length > 150
                    ? `${tender.description.substring(0, 150)}...`
                    : tender.description}
                </p>
              )}

              {/* Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{formatCurrency(tender.estimated_budget)}</span>
                </div>

                {tender.bid_end_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      Closes: {formatDate(tender.bid_end_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/tender/${tender.id}`)}
                  className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 font-medium transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/tender/${tender.id}`)}
                  className="px-6 py-2 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-colors"
                >
                  Submit Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableTenders;

