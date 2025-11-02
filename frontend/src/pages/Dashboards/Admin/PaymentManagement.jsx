import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import {
  connectAptosWallet,
  disconnectAptosWallet,
  getAptosBalance,
  payContractor,
  isPetraInstalled,
} from "../../../utils/aptosPayment";

const PaymentManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Aptos wallet state
  const [aptosWallet, setAptosWallet] = useState(null);
  const [aptosBalance, setAptosBalance] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      // Fetch all awarded tenders with bids
      const { data: tenders, error } = await supabase
        .from("tenders")
        .select("*")
        .in("status", ["awarded", "completed"])
        .not("blockchain_tender_id", "is", null);

      if (error) throw error;

      // For each tender, get the winning bid
      const contractsWithBids = await Promise.all(
        (tenders || []).map(async (tender) => {
          const { data: bids } = await supabase
            .from("bids")
            .select("*, contractor:contractor_id(email)")
            .eq("tender_id", tender.id)
            .order("bid_amount", { ascending: true })
            .limit(1);

          return {
            ...tender,
            winningBid: bids && bids.length > 0 ? bids[0] : null,
          };
        })
      );

      setContracts(contractsWithBids.filter(c => c.winningBid));
    } catch (error) {
      console.error("Error fetching contracts:", error);
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

  const handlePayment = async () => {
    if (!aptosWallet) {
      alert("Please connect your Aptos wallet first");
      return;
    }

    if (!selectedContract || !selectedContract.winningBid) {
      alert("No contract selected");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (aptosBalance < amount) {
      alert(`Insufficient balance. You need ${amount} APT but have ${aptosBalance.toFixed(4)} APT`);
      return;
    }

    // Get contractor's Aptos wallet address from their profile
    const { data: contractorProfile } = await supabase
      .from("profiles")
      .select("aptos_wallet_address")
      .eq("id", selectedContract.winningBid.contractor_id)
      .single();

    if (!contractorProfile?.aptos_wallet_address) {
      alert("Contractor hasn't connected their Aptos wallet yet. Please ask them to connect their wallet first.");
      return;
    }

    const confirmed = window.confirm(
      `Pay ${amount} APT to contractor?\n\nTo: ${contractorProfile.aptos_wallet_address}\nAmount: ${amount} APT\n\nThis will transfer APT from your wallet.`
    );

    if (!confirmed) return;

    setProcessing(true);
    try {
      const response = await payContractor(
        contractorProfile.aptos_wallet_address,
        amount
      );

      console.log("Payment successful:", response);
      alert(`Payment successful!\n\nTransaction hash: ${response.hash}\n\nAmount: ${amount} APT`);

      // Update payment record in database
      await supabase.from("payments").insert({
        tender_id: selectedContract.id,
        contractor_id: selectedContract.winningBid.contractor_id,
        amount: amount,
        tx_hash: response.hash,
        status: "completed",
        paid_at: new Date().toISOString(),
      });

      // Refresh balance
      const newBalance = await getAptosBalance(aptosWallet.address);
      setAptosBalance(newBalance);
      setPaymentAmount("");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed: " + error.message);
    } finally {
      setProcessing(false);
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
          onClick={() => navigate("/dashboard/admin")}
          className="mb-4 text-white/60 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
        <p className="text-white/60">Pay contractors using Aptos blockchain</p>
      </div>

      {/* Wallet Connection */}
      <div className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
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
              <p className="text-white/60">Connect your Petra wallet to make payments</p>
            )}
          </div>
          <div>
            {aptosWallet ? (
              <button
                onClick={handleDisconnectWallet}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Disconnect Wallet
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
      </div>

      {/* Contracts List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Contracts */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-white mb-4">Awarded Contracts</h2>
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                No awarded contracts found
              </div>
            ) : (
              contracts.map((contract) => (
                <div
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedContract?.id === contract.id
                      ? "bg-emerald-500/20 border-emerald-500/50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <h3 className="font-semibold text-white mb-2">{contract.title}</h3>
                  <p className="text-sm text-white/60 mb-2">{contract.category}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Bid Amount:</span>
                    <span className="text-emerald-300 font-semibold">
                      ₹{contract.winningBid.bid_amount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Payment Details */}
        <div className="lg:col-span-2">
          {selectedContract ? (
            <div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">{selectedContract.title}</h2>
                
                {/* Contract Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-white/60 text-sm mb-1">Contract Value</p>
                    <p className="text-2xl font-bold text-white">
                      ₹{selectedContract.estimated_budget}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-white/60 text-sm mb-1">Winning Bid</p>
                    <p className="text-2xl font-bold text-emerald-300">
                      ₹{selectedContract.winningBid.bid_amount}
                    </p>
                  </div>
                </div>

                {/* Contractor Info */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Contractor Details</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/80">
                      <span className="text-white/60">Email:</span>{" "}
                      <span className="text-white">{selectedContract.winningBid.contractor?.email || "N/A"}</span>
                    </p>
                    <p className="text-white/80">
                      <span className="text-white/60">Bid Amount:</span>{" "}
                      <span className="text-emerald-300">₹{selectedContract.winningBid.bid_amount}</span>
                    </p>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Make Payment</h3>
                  
                  <div className="mb-4">
                    <label className="block text-white/80 mb-2">Payment Amount (APT)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount in APT"
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-white/60 text-sm mt-2">
                      1 APT = 100,000,000 Octas
                    </p>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={!aptosWallet || processing || !paymentAmount}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors font-medium disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-lg"
                  >
                    {processing ? "Processing..." : `Pay ${paymentAmount || "0"} APT`}
                  </button>

                  {!aptosWallet && (
                    <p className="text-yellow-300 text-sm mt-3 text-center">
                      ⚠️ Please connect your Petra wallet first
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/60">Select a contract to make payment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
