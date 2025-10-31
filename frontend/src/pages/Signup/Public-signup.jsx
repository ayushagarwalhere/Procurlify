import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

const PublicSignup = () => {
  const navigate = useNavigate();
  const { account, connectWallet, disconnectWallet, getShortAddress, isConnecting, error: walletError, isConnected } = useWallet();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    // TODO: send public signup to backend
    setError("");
    navigate("/login/public");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/5">
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          Public Signup
        </h1>

        {error && (
          <div className="bg-red-600/80 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        {walletError && (
          <div className="bg-red-600/80 text-white p-3 rounded mb-4">
            {walletError}
          </div>
        )}

        {/* MetaMask Wallet Connect */}
        <div className="mb-6 pb-6 border-b border-white/10">
          <label className="text-white text-sm mb-2 block">Connect Wallet</label>
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
                  <span>🦊</span>
                  Connect MetaMask
                </>
              )}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <button
            type="submit"
            className="mt-4 bg-white text-black py-3 rounded-lg font-semibold"
          >
            Create Account
          </button>
        </form>

        <div className="text-white/70 text-sm text-center mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login/public")}
            className="underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicSignup;
