import React from "react";
import { TiLocationArrow } from "react-icons/ti";

const HeroNavbar = () => {
  return (
    <div className="absolute h-full w-full bg-black">
      <header className="absolute w-full h-8 bg-gradient-to-r from-[#8e66fe] to-[#f331f0] z-10">
        <h1 className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-serif text-sm">
          <a href="#about" className="hover:text-gray-300">
          Procurlify Launches Transparent Tender Network across Blockchain
          Governance - Learn More</a>
        </h1>
      </header>

      <nav
        className="z-10 flex size-full items-center justify-between bg-black/40 text-white backdrop-blur-2xl backdrop-saturate-150 hover:bg-white/70 hover:text-black
       absolute top-8 w-11/12 h-16 left-1/2 -translate-x-1/2 rounded-md border-white/20 border shadow-lg shadow-black/5 backdrop-brightness-125"
      >
        <div className="left-5 flex items-center gap-7">
          <img
            src="/logos/logo1.png"
            alt="logo"
            className="w-16 hue-rotate-0"
          />
          <h1 className="font-bold text-4xl font-space-grotesk">
            Procurlify
          </h1>
        </div>


        <div className="absolute right-16 flex gap-4 italic font-mono">
          <button className="bg-white/80 text-black rounded-full h-10 px-4 flex items-center gap-2">
            <span className="whitespace-nowrap">Tenders</span>
            <TiLocationArrow />
          </button>

          <button className="bg-white/80 text-black rounded-full h-10 px-4 flex items-center gap-2">
            <span className="whitespace-nowrap">Contractors</span>
            <TiLocationArrow />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default HeroNavbar;
