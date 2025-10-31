import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ContractorSignup = () => {
  const navigate = useNavigate();
  const [firmName, setFirmName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firmName || !gstNumber || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    // TODO: send contractor signup to backend
    setError("");
    navigate("/login/contractor");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/5">
        <h1 className="text-white text-2xl font-bold text-center mb-6">
          Contractor Signup
        </h1>

        {error && (
          <div className="bg-red-600/80 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm">Firm Name</label>
            <input
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Company / Firm name"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">GST Number</label>
            <input
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="GSTIN"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
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
