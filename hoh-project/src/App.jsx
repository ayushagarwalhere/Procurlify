import React from 'react'
import HeroNavbar from './components/HeroNavbar.jsx'
import Hero from './pages/Hero.jsx'
import About from './pages/About.jsx'



const App = () => {
  return (
    <div>
      <HeroNavbar/>
      <Hero/>
      <About/>
    </div>
  )
}

export default App
