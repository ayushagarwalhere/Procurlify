import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PublicLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md bg-black border-4 border-transparent bg-clip-border rounded-xl p-8">
        <h1 className="text-white text-3xl font-bold text-center mb-6">
          Login
        </h1>

        {error && (
          <div className="bg-red-600/80 text-white text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-white text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white placeholder:text-white/60 border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#8e66fe]"
            />
          </div>

          <div>
            <label className="text-white text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full p-3 rounded bg-white/10 text-white placeholder:text-white/60 border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#8e66fe]"
            />
          </div>

          <div className="flex items-center justify-between mt-1">
            <button
              type="button"
              onClick={() => alert("Forgot password flow not implemented")}
              className="text-sm text-white/80 underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="mt-4 bg-white text-black font-semibold py-3 rounded-lg hover:scale-105 transition-transform"
          >
            Sign In
          </button>
        </form>

        <div className="text-white/70 text-sm text-center mt-6">
          Don't have an account?{" "}
          <button onClick={() => navigate("/signup")} className="underline">
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicLogin;
