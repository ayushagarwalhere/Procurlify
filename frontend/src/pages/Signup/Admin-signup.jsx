import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";
import { supabase } from "../../lib/supabase";

const AdminSignup = () => {
  const navigate = useNavigate();
  const {
    account,
    connectWallet,
    disconnectWallet,
    getShortAddress,
    isConnecting,
    error: walletError,
    isConnected,
  } = useWallet();
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName || !fullName || !designation || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    if (!isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            role: "admin",
          },
        },
      });

      if (authError) throw authError;

      // Wait a moment for the trigger to create the user entry
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the users table with admin-specific fields
      if (authData.user) {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            wallet_address: account || null,
            name: fullName,
            org_name: orgName,
            designation: designation,
          })
          .eq("id", authData.user.id);

        if (updateError) {
          console.error("Error updating user:", updateError);
          // Don't throw - user is created in auth, just metadata update failed
        }
      }

      navigate("/login/gov");
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
          className="absolute top-0 w-3/4 h-full left-48 object-center"
        />
      </div>
      <div className="mt-2 relative w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        <h1 className="text-white text-2xl font-bold text-center mb-2 ">
          Admin Signup
        </h1>

        {error && (
          <div className="bg-red-600/80 text-white p-1 rounded mb-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm">Organization Name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="mt-2 w-full p-1 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Designation</label>
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Your role in the organization"
              className="mt-1 w-full p-1 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@org.example"
              className="mt-1 w-full p-1 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="mt-1 w-full p-1 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          {walletError && (
            <div className="bg-red-600/80 text-white p-3 rounded mb-4">
              {walletError}
            </div>
          )}

          {/* MetaMask Wallet Connect */}
          <div className="mb-2 pb-2 border-b border-white/10">
            {isConnected ? (
              <div className="flex items-center justify-between p-1 rounded bg-emerald-500/20 border border-emerald-500/30">
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
                className="w-full bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white text-black py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-white/70 text-sm text-center mt-6">
          Already have an account?{" "}
          <button onClick={() => navigate("/login/gov")} className="underline">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
