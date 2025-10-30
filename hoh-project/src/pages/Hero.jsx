import React from 'react'

const Hero = () => {
  return (
    <div className='max-h-screen'>
        <div>
            <img 
                src='/images/heroimage.png'
                className='absolute top-10 right-20 w-1/3 h-5/6 clip-path-[circle(50%_at_50%_50%)]'
            />
            
            <div className='text-white'>
              <h1>Unprecedented Transparency</h1>
              <h1>For</h1>
            </div>

        </div>


    
        <div>Hero</div>
    </div>
  )
}

export default Hero