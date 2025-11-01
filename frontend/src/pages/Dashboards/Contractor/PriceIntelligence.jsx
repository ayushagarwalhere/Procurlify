import React, { useState } from "react";
import { useProStatus } from "../../../hooks/useProStatus";
import ProUpgradeModal from "../../../components/ProUpgradeModal";

const PriceIntelligence = () => {
  const { isPro, upgradeToPro } = useProStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isPro) {
    return (
      <div className="p-8 bg-black min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Price Intelligence</h1>
            <p className="text-white/60">Unlock advanced analytics and pricing insights</p>
          </div>

          {/* Locked Feature Message */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white/60 font-bold">PRO</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pro Feature</h2>
              <p className="text-white/60 mb-6">
                Price Intelligence is a premium feature available exclusively to Pro members.
              </p>
            </div>

            {/* Feature Preview */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-xl font-bold text-white mb-4">What you'll get:</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Real-time market price analytics and trends</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Competitor bid analysis and insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Price recommendations based on historical data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Sector-wise pricing intelligence</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Advanced forecasting and predictive analytics</span>
                </li>
              </ul>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Upgrade to Pro to Unlock
            </button>
          </div>
        </div>

        <ProUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={upgradeToPro}
        />
      </div>
    );
  }

  // Pro user content
  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Price Intelligence</h1>
            <p className="text-white/60">Advanced analytics and pricing insights</p>
          </div>
          <span className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium">
            Pro Member
          </span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Average Bid Price</h3>
          <p className="text-3xl font-bold text-white">$2,450,000</p>
          <p className="text-green-400 text-sm mt-2">↑ 12% from last month</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Competitor Analysis</h3>
          <p className="text-3xl font-bold text-white">8.5/10</p>
          <p className="text-white/60 text-sm mt-2">Competitive advantage score</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white/60 text-sm mb-2">Price Range</h3>
          <p className="text-3xl font-bold text-white">$1.8M - $3.2M</p>
          <p className="text-white/60 text-sm mt-2">Recommended bidding range</p>
        </div>
      </div>

      {/* Price Trends */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Price Trends</h2>
        <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
          <p className="text-white/60">Price trend chart will be displayed here</p>
        </div>
      </div>

      {/* Competitor Insights */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Competitor Insights</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <h3 className="text-white font-semibold">ABC Contractors</h3>
              <p className="text-white/60 text-sm">Average bid: $2,200,000</p>
            </div>
            <span className="text-white/60 text-sm">Win rate: 35%</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <h3 className="text-white font-semibold">XYZ Builders</h3>
              <p className="text-white/60 text-sm">Average bid: $2,600,000</p>
            </div>
            <span className="text-white/60 text-sm">Win rate: 28%</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="text-white font-semibold">Premium Constructors</h3>
              <p className="text-white/60 text-sm">Average bid: $2,800,000</p>
            </div>
            <span className="text-white/60 text-sm">Win rate: 22%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceIntelligence;

