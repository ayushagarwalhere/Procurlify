import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { account, getShortAddress, disconnectWallet, isConnected } =
    useWallet();

  // Example stats - in a real app, these would come from your backend
  const stats = [
    { label: "Tenders under Construction", value: "3" },
    { label: "Total Tenders Created", value: "18" },
    { label: "Active Bids", value: "2" },
    { label: "Pending Reviews", value: "1" },
  ];

  const recentTenders = [
    {
      id: 1,
      title: "Infrastructure Development Project",
      bids: 8,
      status: "Work in progress",
      deadline: "2025-12-01",
    },
    {
      id: 2,
      title: "Smart City Initiative",
      bids: 12,
      status: "Under Review",
      deadline: "2025-11-15",
    },
    {
      id: 3,
      title: "Public Transport Upgrade",
      bids: 5,
      status: "Bidding Ongoing",
      deadline: "2025-11-30",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
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

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => navigate("/tender/create")}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            Create New Tender
          </button>
        </div>

        {/* Recent Tenders Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b border-white/10">
            Recent Tenders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60">Title</th>
                  <th className="text-left p-4 text-white/60">Bids</th>
                  <th className="text-left p-4 text-white/60">Status</th>
                  <th className="text-left p-4 text-white/60">Deadline</th>
                  <th className="text-left p-4 text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTenders.map((tender) => (
                  <tr
                    key={tender.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="p-4">{tender.title}</td>
                    <td className="p-4">{tender.bids}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          tender.status === "Under Review"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {tender.status}
                      </span>
                    </td>
                    <td className="p-4">{tender.deadline}</td>
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

export default AdminDashboard;
