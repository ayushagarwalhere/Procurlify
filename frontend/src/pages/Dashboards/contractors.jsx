import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";
import { supabase } from "../../lib/supabase";

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { account, getShortAddress, disconnectWallet, isConnected } =
    useWallet();

  const [userTenders, setUserTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pro feature state (simple local simulation)
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("isPro");
      setIsPro(stored === "true");
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const fetchUserTenders = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: userResponse, error: userError } = await supabase.auth.getUser();
        if (userError || !userResponse?.user?.id) {
          throw new Error("Failed to fetch user details. Please log in again.");
        }

        const userId = userResponse.user.id;
        const { data, error } = await supabase
          .from("tenders")
          .select("*")
          .eq("created_by", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setUserTenders(data);
      } catch (err) {
        console.error("Error fetching user tenders:", err);
        setError(err.message || "Failed to load tenders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTenders();
  }, []);

  const dummyTenders = [
    {
      id: 1,
      title: "Infrastructure Development Project",
      category: "Infrastructure",
      estimated_budget: "₹2,50,00,000",
      status: "Under Review",
    },
    {
      id: 2,
      title: "Smart City Initiative",
      category: "Urban Development",
      estimated_budget: "₹1,75,00,000",
      status: "Accepted",
    },
    {
      id: 3,
      title: "Public Transport Upgrade",
      category: "Transportation",
      estimated_budget: "₹3,20,00,000",
      status: "Pending",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Pro Features Modal */}
      {showProModal && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setShowProModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50">
            <div className="bg-black border border-white/10 rounded-xl p-4 shadow-xl">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-bold">Pro Features</h2>
                <button
                  onClick={() => setShowProModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    🚀 Priority Tender Alerts
                  </h3>
                  <p className="text-white/70">
                    Get instant notifications for high-value tenders matching
                    your expertise. Be among the first to bid and increase your
                    chances of winning.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    ⚡ Fast-Bid Technology
                  </h3>
                  <p className="text-white/70">
                    Save hours on bid preparation with our AI-powered Fast-Bid
                    system. Pre-filled forms based on your past successful bids
                    and tender requirements.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    📊 Advanced Analytics
                  </h3>
                  <ul className="text-white/70 space-y-2">
                    <li>• Real-time win rate analysis</li>
                    <li>• Competitor insights and bid patterns</li>
                    <li>• Sector-wise performance metrics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    🏆 Bid History & Insights
                  </h3>
                  <ul className="text-white/70 space-y-2">
                    <li>• View other contractors' bid history</li>
                    <li>• Track historical bid trends by sector</li>
                    <li>• Bid range recommendations</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      upgradeToPro();
                      setShowProModal(false);
                    }}
                    className="w-full py-2 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
                  >
                    Upgrade to Pro Now
                  </button>
                  <p className="text-center text-white/60 mt-3 text-sm">
                    Contact support for enterprise pricing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contractor Dashboard</h1>
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
        {/* User-Created Tenders */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden mb-8">
          <h2 className="text-xl font-semibold p-6 border-b border-white/10">
            My Tenders
          </h2>
          {loading ? (
            <p className="p-6">Loading...</p>
          ) : error ? (
            <p className="p-6 text-red-500">{error}</p>
          ) : userTenders.length === 0 ? (
            <p className="p-6">No tenders created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60">Title</th>
                    <th className="text-left p-4 text-white/60">Category</th>
                    <th className="text-left p-4 text-white/60">Budget</th>
                    <th className="text-left p-4 text-white/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userTenders.map((tender) => (
                    <tr
                      key={tender.id}
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <td className="p-4">{tender.title}</td>
                      <td className="p-4">{tender.category}</td>
                      <td className="p-4">{tender.estimated_budget}</td>
                      <td className="p-4">{tender.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dummy Tenders */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b border-white/10">
            Example Tenders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60">Title</th>
                  <th className="text-left p-4 text-white/60">Category</th>
                  <th className="text-left p-4 text-white/60">Budget</th>
                  <th className="text-left p-4 text-white/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {dummyTenders.map((tender) => (
                  <tr
                    key={tender.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="p-4">{tender.title}</td>
                    <td className="p-4">{tender.category}</td>
                    <td className="p-4">{tender.estimated_budget}</td>
                    <td className="p-4">{tender.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContractorDashboard;
