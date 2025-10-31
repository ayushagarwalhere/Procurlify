import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orgName || !fullName || !designation || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    // TODO: send signup request to backend
    setError("");
    // After successful signup, navigate to admin login
    navigate("/login/gov");
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

          <button
            type="button"
            onClick={() => alert("Wallet connection will be implemented")}
            className="mt-2 bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-white py-2 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
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
            Connect Wallet
          </button>

          <button
            type="submit"
            className="mt-2 bg-white text-black py-2 rounded-lg font-semibold"
          >
            Create Account
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
