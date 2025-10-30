import React from 'react'
import { useState, useEffect } from 'react';


const Hero = () => {

  const words = ["Contractors", "Government", "Public"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let typingSpeed = isDeleting ? 80 : 150; // Adjust speeds for typing/deleting

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing phase
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        } else {
          // Wait before starting to delete
          setTimeout(() => setIsDeleting(true), 1000);
        }
      } else {
        // Deleting phase
        if (displayedText.length > 0) {
          setDisplayedText(currentWord.slice(0, displayedText.length - 1));
        } else {
          // Move to the next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]);


  return (
    <div className='max-h-screen'>
        <div className='relative w-full h-screen bg-black overflow-hidden'>
          <img 
            src='/images/heroimage.png'
            className='absolute top-0 right-20 w-[39%] [clip-path:polygon(0%_0%,100%_20%,100%_50%,0%_60%)]'
          />
        </div>


        <div className='absolute top-32 left-14 text-white text-7xl font-poppins flex flex-col'>
          <h1>Decentralised Procure<span className='text-black'>ment</span></h1>
          <h1 className='mt-4'>
            Portal For {''}
            <span className='font-poppins bg-gradient-to-r from-[#8e66fe] to-[#f331f0] text-transparent bg-clip-text'>
              {displayedText}
            </span>
            <span className='border-r-4 border-[#f331f0] animate-pulse'></span> {/* blinking cursor */}
          </h1>
        </div>


    </div>
  )
}

export default Hero