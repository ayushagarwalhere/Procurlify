import React from "react";

const Role = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center pt-20">
      {/* Heading */}
      <h1 className="text-white text-4xl font-bold mb-16">Select Your Role</h1>

      {/* Circles Container */}
      <div className="flex gap-20 items-center justify-center">
        {/* Government Circle */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full bg-white hover:bg-gray-200 transition-colors duration-300 cursor-pointer flex items-center justify-center"></div>
          <span className="text-white text-xl">Government</span>
        </div>

        {/* Contractor Circle */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full bg-white hover:bg-gray-200 transition-colors duration-300 cursor-pointer flex items-center justify-center"></div>
          <span className="text-white text-xl">Contractor</span>
        </div>

        {/* Public Circle */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 rounded-full bg-white hover:bg-gray-200 transition-colors duration-300 cursor-pointer flex items-center justify-center"></div>
          <span className="text-white text-xl">Public</span>
        </div>
      </div>
    </div>
  );
};

export default Role;
