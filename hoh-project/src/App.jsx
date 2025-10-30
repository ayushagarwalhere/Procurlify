import React from 'react'
import HeroNavbar from './components/HeroNavbar.jsx'
import Hero from './pages/Hero.jsx'
import About from './pages/About.jsx'
import DepartmentsPage from './pages/Departments.jsx'



const App = () => {
  return (
    <div>
      <HeroNavbar/>
      <Hero/>
      <DepartmentsPage/>
      <About/>
    </div>
  )
}

export default App
