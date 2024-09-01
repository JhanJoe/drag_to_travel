"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const images = [
  "/images/Asu-1.jpg",
  "/images/Asu-2.jpg",
  "/images/Biei-1.jpg",
  "/images/Mojiko-1.jpg",
  "/images/Obihiro-1.jpg",
  "/images/Otaru-1.jpg",
  "/images/Sea-1.jpg",
];

const HomePage: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const fullText = "讓我們一點一點開始建立屬於你的行程";
  
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3600); 
  
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      setIsLoaded(true);
      setTimeout(() => setTextVisible(true), 300);
    }, []);

  return (
    <div className="home-page flex flex-col items-center justify-center text-center">
      <div className="relative w-full h-screen overflow-hidden">
      {/* TODO還不確定要不要放影片 
        <video
          autoPlay
          loop
          muted
          className="absolute w-full h-full object-cover opacity-45"
        >
          <source src="/videos/sky-1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video> */}
        {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
            <Image
              src={image}
              alt={`Banner ${index + 1}`}
              fill
              style={{ objectFit: 'cover' }}
              className="w-full h-auto sm:h-full opacity-60" 
            />
          </div>
        ))}
          <div className="absolute inset-x-0 top-1/4 flex flex-col items-center md:items-start px-20 md:justify-center ">
            <h1 className="text-4xl xs:text-6xl md:text-8xl font-bold text-custom-atomic-tangerine transition-all duration-1000 ease-out" style={{ textShadow: '2px 2px 4px rgba(255, 253, 130, 0.5)'}}>
              旅遊 X 拖拉
            </h1>
            <div className="overflow-hidden h-16 mt-4">
            <span 
              className={`text-md xs:text-lg md:text-2xl text-white inline-block ml-2 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                transition: 'all 1s ease-out'
              }}
            >
              {fullText}
            </span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default HomePage;

