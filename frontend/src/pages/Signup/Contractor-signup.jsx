import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";
import { supabase } from "../../lib/supabase";

const ContractorSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  // Basic Information
  const {
    account,
    connectWallet,
    disconnectWallet,
    getShortAddress,
    isConnecting,
    error: walletError,
    isConnected,
  } = useWallet();
  const [firmName, setFirmName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Bank Information
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!firmName || !gstNumber || !email || !password) {
      setError("Please fill all fields in step 1.");
      return;
    }

    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Sign up with Supabase Auth in step 1
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: firmName,
            role: "contractor",
          },
        },
      });

      if (authError) throw authError;

      // Wait a moment for the trigger to create the user entry
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update basic fields only if they are not already set
      if (authData.user) {
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("wallet_address, name, firm_name, gst_number")
          .eq("id", authData.user.id)
          .single();

        if (fetchError) throw fetchError;

        const updates = {};
        if (existingUser.wallet_address !== account) updates.wallet_address = account || null;
        if (existingUser.name !== firmName) updates.name = firmName;
        if (existingUser.firm_name !== firmName) updates.firm_name = firmName;
        if (existingUser.gst_number !== gstNumber) updates.gst_number = gstNumber;

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("users")
            .update(updates)
            .eq("id", authData.user.id);

          if (updateError) {
            console.error("Error updating user:", updateError);
          }
        }
      }

      setStep(2); // Transition to step 2
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName || !accountNumber || !ifscCode || !bankName || !bankBranch) {
      setError("Please fill all bank details.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get the current user (created in step 1)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not found. Please go back and complete step 1.");
      }

      // Update bank details only if they are not already set
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("bank_account_name, bank_account_number, bank_ifsc_code, bank_name, bank_branch")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const updates = {};
      if (existingUser.bank_account_name !== accountName) updates.bank_account_name = accountName;
      if (existingUser.bank_account_number !== accountNumber) updates.bank_account_number = accountNumber;
      if (existingUser.bank_ifsc_code !== ifscCode) updates.bank_ifsc_code = ifscCode;
      if (existingUser.bank_name !== bankName) updates.bank_name = bankName;
      if (existingUser.bank_branch !== bankBranch) updates.bank_branch = bankBranch;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id);

        if (updateError) {
          throw new Error("Failed to update bank details. Please try again.");
        }
      }

      navigate("/login/contractor");
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden flex items-center justify-center px-4 relative bg-black">
      <div className="fixed inset-0 w-full h-full">
        <img
          src="/images/login-bg.png"
          alt="background"
          className="absolute top-0 w-3/4 left-48 object-center"
        />
      </div>
      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          Contractor Signup -{" "}
          {step === 1 ? "Basic Information" : "Bank Details"}
        </h1>

        {error && (
          <div className="bg-red-600/80 text-white p-1 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="flex flex-col gap-4">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <div>
                <label className="text-white text-sm">Firm Name</label>
                <input
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Company / Firm name"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">GST Number</label>
                <input
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="GSTIN"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@firm.com"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              {walletError && (
                <div className="bg-red-600/80 text-white p-3 rounded mb-4">
                  {walletError}
                </div>
              )}

              {/* MetaMask Wallet Connect */}
              <div className="mb-6 pb-6 border-b border-white/10">
                {isConnected ? (
                  <div className="flex items-center justify-between p-3 rounded bg-emerald-500/20 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="text-white text-sm font-mono">
                        {getShortAddress(account)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={disconnectWallet}
                      className="text-xs text-white/70 hover:text-white underline"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Connect MetaMask
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step 2: Bank Details */}
          {step === 2 && (
            <>
              <div>
                <label className="text-white text-sm">Account Holder Name</label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account holder's name"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">Account Number</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Bank account number"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">IFSC Code</label>
                <input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="Bank IFSC code"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">Bank Name</label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Name of the bank"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>

              <div>
                <label className="text-white text-sm">Branch Name</label>
                <input
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="Bank branch name"
                  className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-4 bg-gray-500 text-white py-1 rounded-lg font-semibold flex-1"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-white text-black py-1 rounded-lg font-semibold flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : step === 1 ? "Next: Bank Details" : "Create Account"}
            </button>
          </div>
        </form>

        <div className="text-white/70 text-sm text-center mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login/contractor")}
            className="underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorSignup;
