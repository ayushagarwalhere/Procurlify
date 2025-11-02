import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import {
  connectAptosWallet,
  disconnectAptosWallet,
  getAptosBalance,
  isPetraInstalled,
} from "../../../utils/aptosPayment";

const PaymentTracking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalReceived, setTotalReceived] = useState(0);
  
  // Aptos wallet state
  const [aptosWallet, setAptosWallet] = useState(null);
  const [aptosBalance, setAptosBalance] = useState(0);
  const [savingWallet, setSavingWallet] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse?.user?.id) return;

      const userId = userResponse.user.id;

      // Fetch won contracts
      const { data: bids } = await supabase
        .from("bids")
        .select("tender_id")
        .eq("contractor_id", userId);

      const tenderIds = bids?.map(b => b.tender_id) || [];

      const { data: tenders } = await supabase
        .from("tenders")
        .select("*")
        .in("id", tenderIds)
        .in("status", ["awarded", "completed"]);

      setContracts(tenders || []);

      // Fetch payment history
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*, tender:tender_id(title)")
        .eq("contractor_id", userId)
        .order("paid_at", { ascending: false });

      setPayments(paymentsData || []);

      // Calculate total received
      const total = (paymentsData || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      setTotalReceived(total);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (!isPetraInstalled()) {
        alert("Please install Petra Wallet from https://petra.app/");
        window.open("https://petra.app/", "_blank");
        return;
      }

      const wallet = await connectAptosWallet();
      setAptosWallet(wallet);

      const balance = await getAptosBalance(wallet.address);
      setAptosBalance(balance);

      console.log("Wallet connected:", wallet);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet: " + error.message);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectAptosWallet();
      setAptosWallet(null);
      setAptosBalance(0);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleSaveWalletAddress = async () => {
    if (!aptosWallet) {
      alert("Please connect your wallet first");
      return;
    }

    setSavingWallet(true);
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse?.user?.id) return;

      const { error } = await supabase
        .from("profiles")
        .update({ aptos_wallet_address: aptosWallet.address })
        .eq("id", userResponse.user.id);

      if (error) throw error;

      alert("Wallet address saved successfully! Admin can now send payments to this address.");
    } catch (error) {
      console.error("Error saving wallet address:", error);
      alert("Failed to save wallet address: " + error.message);
    } finally {
      setSavingWallet(false);
    }
  };

  const refreshBalance = async () => {
    if (aptosWallet) {
      const balance = await getAptosBalance(aptosWallet.address);
      setAptosBalance(balance);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/dashboard/contractor")}
          className="mb-4 text-white/60 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Tracking</h1>
        <p className="text-white/60">Track your earnings from awarded contracts</p>
      </div>

      {/* Wallet Connection */}
      <div className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">Aptos Wallet (Petra)</h3>
            {aptosWallet ? (
              <div className="space-y-2">
                <p className="text-white/80">
                  <span className="text-white/60">Address:</span>{" "}
                  <span className="font-mono text-emerald-300">
                    {aptosWallet.address.slice(0, 10)}...{aptosWallet.address.slice(-8)}
                  </span>
                </p>
                <p className="text-white/80">
                  <span className="text-white/60">Balance:</span>{" "}
                  <span className="font-bold text-emerald-300">{aptosBalance.toFixed(4)} APT</span>
                </p>
              </div>
            ) : (
              <p className="text-white/60">Connect your Petra wallet to receive payments</p>
            )}
          </div>
          <div className="flex gap-3">
            {aptosWallet && (
              <>
                <button
                  onClick={refreshBalance}
                  className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={handleSaveWalletAddress}
                  disabled={savingWallet}
                  className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:bg-gray-500"
                >
                  {savingWallet ? "Saving..." : "💾 Save Address"}
                </button>
              </>
            )}
            {aptosWallet ? (
              <button
                onClick={handleDisconnectWallet}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Connect Petra Wallet
              </button>
            )}
          </div>
        </div>
        {aptosWallet && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              💡 <strong>Important:</strong> Click "Save Address" to let admin know where to send your payments!
            </p>
          </div>
        )}
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Total Received</p>
          <p className="text-3xl font-bold text-emerald-300">
            {totalReceived.toFixed(4)} APT
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Wallet Balance</p>
          <p className="text-3xl font-bold text-blue-300">
            {aptosBalance.toFixed(4)} APT
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Active Contracts</p>
          <p className="text-3xl font-bold text-purple-300">{contracts.length}</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Payment History</h2>
        
        {payments.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <p className="text-lg mb-2">No payments received yet</p>
            <p className="text-sm">Payments will appear here once admin sends them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-black/30 border border-white/10 rounded-lg p-4 hover:bg-black/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{payment.tender?.title || "Contract Payment"}</h3>
                    <p className="text-sm text-white/60">
                      {new Date(payment.paid_at).toLocaleDateString()} at {new Date(payment.paid_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-300">
                      {parseFloat(payment.amount).toFixed(4)} APT
                    </p>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                      ✓ Completed
                    </span>
                  </div>
                </div>
                {payment.tx_hash && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-white/60">
                      TX: <span className="font-mono text-white/80">{payment.tx_hash.slice(0, 20)}...</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Contracts */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">My Awarded Contracts</h2>
        
        {contracts.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <p className="text-lg">No awarded contracts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-black/30 border border-white/10 rounded-lg p-4 hover:bg-black/40 transition-colors"
              >
                <h3 className="font-semibold text-white mb-2">{contract.title}</h3>
                <p className="text-sm text-white/60 mb-3">{contract.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Budget:</span>
                  <span className="text-emerald-300 font-semibold">₹{contract.estimated_budget}</span>
                </div>
                <button
                  onClick={() => navigate(`/tender/${contract.id}`)}
                  className="mt-3 w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTracking;
