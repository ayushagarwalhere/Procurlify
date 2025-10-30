import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeroNavbar from "./components/HeroNavbar.jsx";
import Hero from "./pages/Hero.jsx";
import About from "./pages/About.jsx";
import Role from "./pages/Role.jsx";

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
      </Routes>
    </Router>
  );
};

export default App;
