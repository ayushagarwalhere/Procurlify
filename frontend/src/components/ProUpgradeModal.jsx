import React, { useState } from "react";

const ProUpgradeModal = ({ isOpen, onClose, onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  if (!isOpen) return null;

  const proFeatures = [
    {
      title: "Price Intelligence",
      description: "Advanced analytics and pricing insights to optimize your bids",
    },
    {
      title: "Priority Tender Alerts",
      description: "Get instant notifications for high-value tenders matching your expertise",
    },
    {
      title: "Fast-Bid Technology",
      description: "AI-powered Fast-Bid system with pre-filled forms based on past successful bids",
    },
    {
      title: "Bid History & Insights",
      description: "View competitor bid history and track historical bid trends by sector",
    },
  ];

  const plans = {
    monthly: {
      price: "$4",
      period: "month",
      save: "",
    },
    yearly: {
      price: "$39",
      period: "year",
      save: "Save 17%",
    },
  };

  const currentPlan = plans[selectedPlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-black border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Pro</h2>
            <p className="text-white/60">Unlock powerful features to grow your business</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedPlan === "monthly"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors relative ${
                selectedPlan === "yearly"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Yearly
              {selectedPlan === "yearly" && (
                <span className="absolute -top-2 -right-2 bg-white text-black text-xs px-2 py-1 rounded">
                  Save 17%
                </span>
              )}
            </button>
          </div>

          {/* Pricing Card */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-8 text-center">
            <div className="mb-4">
              <span className="text-white/60 text-lg">Pro Plan</span>
            </div>
            <div className="mb-2">
              <span className="text-5xl font-bold text-white">{currentPlan.price}</span>
              <span className="text-white/60 ml-2">/{currentPlan.period}</span>
            </div>
            {currentPlan.save && (
              <p className="text-green-400 text-sm mt-2">{currentPlan.save}</p>
            )}
          </div>

          {/* Features Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Pro Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                  <p className="text-white/60 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onUpgrade(selectedPlan);
                onClose();
              }}
              className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 font-medium transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              All plans include 30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;

