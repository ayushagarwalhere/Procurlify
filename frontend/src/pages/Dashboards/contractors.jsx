import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { account, getShortAddress, disconnectWallet, isConnected } =
    useWallet();

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

  const upgradeToPro = () => {
    try {
      localStorage.setItem("isPro", "true");
    } catch (e) {}
    setIsPro(true);
    alert("Pro unlocked — premium features are now available.");
  };

  // Example stats - in a real app, these would come from your backend
  const stats = [
    { label: "Active Bids", value: "3" },
    { label: "Projects under Construction", value: "1" },
    { label: "Available Tenders", value: "9" },
  ];

  const activeBids = [
    {
      id: 1,
      tender: "Infrastructure Development Project",
      bidAmount: "₹2,50,00,000",
      status: "Under Review",
      submittedOn: "2025-10-28",
    },
    {
      id: 2,
      tender: "Smart City Initiative",
      bidAmount: "₹1,75,00,000",
      status: "Accepted",
      submittedOn: "2025-10-15",
    },
    {
      id: 3,
      tender: "Public Transport Upgrade",
      bidAmount: "₹3,20,00,000",
      status: "Pending",
      submittedOn: "2025-10-30",
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

        {/* Pro Features Card */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pro Features</h3>
              {isPro ? (
                <span className="text-sm px-2 py-1 border border-white/10 rounded">
                  PRO
                </span>
              ) : (
                <span className="text-sm px-2 py-1 border border-white/10 rounded text-white/60">
                  Free
                </span>
              )}
            </div>

            
              <div className="mt-4 text-white/70">
                <ul className="list-disc list-inside space-y-2">
                  <li>Priority tender alerts</li>
                  <li>Fast-bid (pre-fill & submit)</li>
                  <li>Premium analytics & success insights</li>
                </ul>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={upgradeToPro}
                    className="px-4 py-2 bg-white text-black rounded-lg font-semibold"
                  >
                    Upgrade to Pro
                  </button>
                  <button
                    onClick={() => setShowProModal(true)}
                    className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
                  >
                    Learn more
                  </button>
                </div>
              </div>
            </div>

          {/* Priority Alerts Card */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold">Priority Alerts</h3>
            <p className="text-white/70 mt-2">
              Get notified about high-value tenders as soon as they're
              published.
            </p>
            <div className="mt-4">
              <button
                onClick={() =>
                  alert(
                    isPro
                      ? "Subscribed to priority alerts"
                      : "Upgrade to Pro to subscribe"
                  )
                }
                className={`px-4 py-2 rounded-lg ${
                  isPro ? "bg-white text-black" : "border border-white/20"
                }`}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Active Bids Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b border-white/10">
            Active Bids
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60">Tender</th>
                  <th className="text-left p-4 text-white/60">Bid Amount</th>
                  <th className="text-left p-4 text-white/60">Status</th>
                  <th className="text-left p-4 text-white/60">Submitted On</th>
                  <th className="text-left p-4 text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeBids.map((bid) => (
                  <tr
                    key={bid.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="p-4">{bid.tender}</td>
                    <td className="p-4">{bid.bidAmount}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          bid.status === "Accepted"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : bid.status === "Under Review"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-white/20 text-white"
                        }`}
                      >
                        {bid.status}
                      </span>
                    </td>
                    <td className="p-4">{bid.submittedOn}</td>
                    <td className="p-4">
                      <button className="text-white/60 hover:text-white">
                        View Details
                      </button>
                    </td>
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
