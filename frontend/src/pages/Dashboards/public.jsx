import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

const PublicDashboard = () => {
  const navigate = useNavigate();
  const { account, getShortAddress, disconnectWallet, isConnected } =
    useWallet();

  // Example stats - in a real app, these would come from your backend
  const stats = [
    { label: "Active Tenders", value: "27" },
    { label: "Total Projects", value: "156" },
    { label: "Ongoing Projects", value: "23" },
    { label: "Completed Projects", value: "133" },
  ];

  const recentTenders = [
    {
      id: 1,
      title: "Infrastructure Development Project",
      department: "Public Works",
      budget: "₹2,50,00,000",
      deadline: "2025-12-01",
      awardedTo: "A. Constructions Pvt Ltd",
      daysToComplete: 120,
    },
    {
      id: 2,
      title: "Smart City Initiative",
      department: "Urban Development",
      budget: "₹1,75,00,000",
      deadline: "2025-11-15",
      awardedTo: "CityBuild Contractors",
      daysToComplete: 90,
    },
    {
      id: 3,
      title: "Public Transport Upgrade",
      department: "Transport",
      budget: "₹3,20,00,000",
      deadline: "2025-11-30",
      awardedTo: null, // not yet awarded
      daysToComplete: null,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Public Dashboard</h1>
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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search for tenders..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-white/40"
            />
            <button className="px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Available Tenders Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b border-white/10">
            Available Tenders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60">Title</th>
                  <th className="text-left p-4 text-white/60">Department</th>
                  <th className="text-left p-4 text-white/60">Budget</th>
                  <th className="text-left p-4 text-white/60">Deadline</th>
                  <th className="text-left p-4 text-white/60">Contractor</th>
                  <th className="text-left p-4 text-white/60">
                    Days to Complete
                  </th>
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
                    <td className="p-4">{tender.department}</td>
                    <td className="p-4">{tender.budget}</td>
                    <td className="p-4">{tender.deadline}</td>
                    <td className="p-4">
                      {tender.awardedTo ? (
                        <span className="text-white">{tender.awardedTo}</span>
                      ) : (
                        <span className="text-white/60">Not awarded</span>
                      )}
                    </td>
                    <td className="p-4">
                      {tender.daysToComplete ? (
                        <span className="text-white">
                          {tender.daysToComplete} days
                        </span>
                      ) : (
                        <span className="text-white/60">—</span>
                      )}
                    </td>
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

        {/* Timeline of Recent Updates */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
              <div>
                <p className="font-semibold">
                  New Smart City Project Announced
                </p>
                <p className="text-white/60 text-sm">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
              <div>
                <p className="font-semibold">
                  Infrastructure Project Completed
                </p>
                <p className="text-white/60 text-sm">1 day ago</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-white mt-2"></div>
              <div>
                <p className="font-semibold">5 New Tenders Added</p>
                <p className="text-white/60 text-sm">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicDashboard;
