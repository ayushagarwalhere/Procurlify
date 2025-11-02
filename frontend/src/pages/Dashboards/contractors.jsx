import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ContractorSidebar from "../../components/ContractorSidebar";
import ContractorMainDashboard from "./Contractor/ContractorMainDashboard";
import AvailableTenders from "./Contractor/AvailableTenders";
import MyBids from "./Contractor/MyBids";
import PriceIntelligence from "./Contractor/PriceIntelligence";
import SubmitBid from "./Contractor/SubmitBid";
import { useWallet } from "../../hooks/useWallet";
import PaymentTracking from "./Contractor/PaymentTracking";

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { account, getShortAddress, isConnected } = useWallet();

  // Placeholder components for other routes
  const MyContracts = () => (
    <div className="p-8 bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-2">My Contracts</h1>
      <p className="text-white/60">View your awarded contracts</p>
      <div className="mt-8 text-center text-white/60">
        <p>Contract management coming soon...</p>
      </div>
    </div>
  );

  const MyProjects = () => (
    <div className="p-8 bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-2">My Projects</h1>
      <p className="text-white/60">Track your active projects</p>
      <div className="mt-8 text-center text-white/60">
        <p>Project tracking coming soon...</p>
      </div>
    </div>
  );

  const Marketplace = () => (
    <div className="p-8 bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
      <p className="text-white/60">Browse marketplace opportunities</p>
      <div className="mt-8 text-center text-white/60">
        <p>Marketplace coming soon...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <ContractorSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-black border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span className="font-mono text-sm text-white">
                  {getShortAddress(account)}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route index element={<ContractorMainDashboard />} />
            <Route path="tenders" element={<AvailableTenders />} />
            <Route path="submit-bid/:tenderId" element={<SubmitBid />} />
            <Route path="bids" element={<MyBids />} />
            <Route path="contracts" element={<MyContracts />} />
            <Route path="projects" element={<MyProjects />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="intelligence" element={<PriceIntelligence />} />
            <Route path="payment-tracking" element={<PaymentTracking />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ContractorDashboard;
