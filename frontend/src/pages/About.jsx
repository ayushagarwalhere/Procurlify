import React from 'react'
import { TiLocationArrow } from 'react-icons/ti'

const About = () => {
  return (
    <div id="about" className="bg-black text-white w-full mt-20">
      <div className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="mb-8">
          <h2 className="text-7xl md:text-6xl font-poppins">
            About <span className="bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-transparent bg-clip-text">Procurlify</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-3xl leading-7">
            Procurlify is a decentralized procurement portal designed to bring transparency,
            efficiency, and inclusivity to public tenders. Built across blockchain governance,
            it streamlines engagement for Government, Contractors, and the Public with an
            auditable, real-time tender network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-2xl font-space-grotesk">For Companies/Clients</h3>
            <p className="mt-3 text-white/70">
              Publish tamper-evident tenders, manage evaluations, and ensure fair, compliant processes.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-2xl font-space-grotesk">For Contractors</h3>
            <p className="mt-3 text-white/70">
              Discover opportunities, submit bids securely, and build trust with verifiable performance.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-2xl font-space-grotesk">For the Public</h3>
            <p className="mt-3 text-white/70">
              Track projects, explore insights, and hold procurement accountable through transparency.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <a href="#tenders" className="bg-white/80 text-black rounded-full h-12 px-6 flex items-center gap-2">
            <span className="whitespace-nowrap">Explore Tenders</span>
            <TiLocationArrow />
          </a>
          <a href="#contractors" className="bg-white/80 text-black rounded-full h-12 px-6 flex items-center gap-2">
            <span className="whitespace-nowrap">Join as Contractor</span>
            <TiLocationArrow />
          </a>
        </div>
      </div>

    
    </div>
  )
}

export default About


