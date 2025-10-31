import React from "react";
import { useNavigate } from "react-router-dom";

const Role = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center pt-40">
      {/* Heading */}
      <h1 className="text-white text-4xl font-bold mb-16">Select Your Role</h1>

      {/* Circles Container */}
      <div className="flex gap-20 items-center justify-center">
        {/* Government Circle */}
        <div
          className="flex flex-col items-center gap-4"
          onClick={() => navigate("/login/gov")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/login/gov");
          }}
        >
          <div className="w-40 h-40 rounded-full bg-white hover:bg-gray-200 transition-colors duration-300 cursor-pointer flex items-center justify-center"></div>
          <span className="text-white text-xl">Admin Portal</span>
        </div>

        {/* Contractor Circle */}
        <div
          className="flex flex-col items-center gap-4"
          onClick={() => navigate("/login/contractor")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/login/contractor");
          }}
        >
          <div className="w-40 h-40 rounded-full bg-white hover:bg-gray-200 transition-colors duration-300 cursor-pointer flex items-center justify-center"></div>
          <span className="text-white text-xl">Contractor Portal</span>
        </div>

        {/* Public Circle */}
        <div
          className="flex flex-col items-center gap-4"
          onClick={() => navigate("/login/public")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/login/public");
          }}
        >
          <div className="w-40 h-40 rounded-full bg-white hover:bg-gray-200 transition-colors duration-300 cursor-pointer flex items-center justify-center"></div>
          <span className="text-white text-xl">View Portal</span>
        </div>
      </div>
    </div>
  );
};

export default Role;
