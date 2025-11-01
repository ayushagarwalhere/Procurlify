import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProStatus } from "../hooks/useProStatus";
import ProUpgradeModal from "./ProUpgradeModal";

const ContractorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro, upgradeToPro } = useProStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard/contractor", isPro: false },
    { id: "tenders", label: "Available Tenders", path: "/dashboard/contractor/tenders", isPro: false },
    { id: "bids", label: "My Bids", path: "/dashboard/contractor/bids", isPro: false },
    { id: "contracts", label: "My Contracts", path: "/dashboard/contractor/contracts", isPro: false },
    { id: "projects", label: "My Projects", path: "/dashboard/contractor/projects", isPro: false },
    { id: "marketplace", label: "Marketplace", path: "/dashboard/contractor/marketplace", isPro: false },
    { id: "intelligence", label: "Price Intelligence", path: "/dashboard/contractor/intelligence", isPro: true },
  ];

  const handleMenuItemClick = (item) => {
    if (item.isPro && !isPro) {
      setShowUpgradeModal(true);
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path) => {
    if (path === "/dashboard/contractor") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-black min-h-screen flex flex-col border-r border-white/10">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold text-xl">
            P
          </div>
          <span className="text-xl font-bold text-white">Procurlify</span>
        </div>
        <p className="text-xs text-white/60 mb-1">Procurement System</p>
        <p className="text-sm font-medium text-white/80">Contractor Portal</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuItemClick(item)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.isPro && !isPro && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                      PRO
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Upgrade to Pro Button */}
      {!isPro && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Pro Badge */}
      {isPro && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-center">
            <div className="text-white font-semibold mb-1">Pro Member</div>
            <div className="text-white/60 text-xs">All features unlocked</div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={upgradeToPro}
      />

      {/* Company Info Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold">
            C
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Contractor Co</p>
            <p className="text-xs text-white/60">Contractor Company Ltd.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorSidebar;

