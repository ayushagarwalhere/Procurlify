import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeroNavbar from "./components/HeroNavbar.jsx";
import Hero from "./pages/Hero.jsx";
import About from "./pages/About.jsx";
import Role from "./pages/Role.jsx";
import ContractorLogin from "./pages/Login/Contractor-login.jsx";
import PublicLogin from "./pages/Login/Public-login.jsx";
import GovLogin from "./pages/Login/Admin-login.jsx";
import AdminSignup from "./pages/Signup/Admin-signup.jsx";
import ContractorSignup from "./pages/Signup/Contractor-signup.jsx";
import PublicSignup from "./pages/Signup/Public-signup.jsx";
import Departments from "./pages/Departments.jsx";

const Home = () => (
  <div>
    <HeroNavbar />
    <Hero />
    <Departments />
    <About />
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/role" element={<Role />} />
        <Route path="/login/contractor" element={<ContractorLogin />} />
        <Route path="/login/public" element={<PublicLogin />} />
        <Route path="/login/gov" element={<GovLogin />} />
        <Route path="/signup/admin" element={<AdminSignup />} />
        <Route path="/signup/contractor" element={<ContractorSignup />} />
        <Route path="/signup/public" element={<PublicSignup />} />
        <Route path="/departments" element={<Departments />} />
      </Routes>
    </Router>
  );
};

export default App;
