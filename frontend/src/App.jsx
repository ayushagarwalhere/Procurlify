import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeroNavbar from "./components/HeroNavbar.jsx";
import Hero from "./pages/Hero.jsx";
import About from "./pages/About.jsx";
import Role from "./pages/Role.jsx";
import ContractorLogin from "./pages/Login/Contractor-login.jsx";
import PublicLogin from "./pages/Login/Public-login.jsx";
import AdminLogin from "./pages/Login/Admin-login.jsx";
import AdminSignup from "./pages/Signup/Admin-signup.jsx";
import ContractorSignup from "./pages/Signup/Contractor-signup.jsx";
import PublicSignup from "./pages/Signup/Public-signup.jsx";
import AdminDashboard from "./pages/Dashboards/admin.jsx";
import ContractorDashboard from "./pages/Dashboards/contractors.jsx";
import PublicDashboard from "./pages/Dashboards/public.jsx";
import CreateTender from "./pages/CreateTender.jsx";

const Home = () => (
  <div>
    <HeroNavbar />
    <Hero />
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
        <Route path="/login/gov" element={<AdminLogin />} />
        <Route path="/signup/admin" element={<AdminSignup />} />
        <Route path="/signup/contractor" element={<ContractorSignup />} />
        <Route path="/signup/public" element={<PublicSignup />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/contractor" element={<ContractorDashboard />} />
        <Route path="/dashboard/public" element={<PublicDashboard />} />
        <Route path="/tender/create" element={<CreateTender />} />
      </Routes>
    </Router>
  );
};

export default App;
