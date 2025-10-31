import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PublicSignup = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen overflow-hidden flex items-center justify-center px-4 relative bg-black">
      <div className="w-full h-full">
        <img
          src="/images/login-bg.png"
          alt="background"
          className="absolute top-0 w-3/4 left-48 object-center"
        />
      </div>
      <div className="relative right-[35%]  w-full max-w-md bg-black/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-white/80 shadow-sm">
        <h1 className="text-white text-xl font-bold text-center mb-4 ">
          Public Signup
        </h1>

        {error && (
          <div className="bg-red-600/80 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className=" w-full p-1 rounded bg-white/10 text-white border border-white/5"
            />
          </div>

          <div>
            <label className="text-white text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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

          <button
            type="button"
            onClick={() => alert("Wallet connection will be implemented")}
            className="mt-4 bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-white py-2 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
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
            className="mt-4 bg-white text-black py-2 rounded-lg font-semibold"
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
