"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import PublicTrip from "./components/PublicTrip";
import { FaThumbsUp } from "react-icons/fa6";
import { MdOutlineKeyboardDoubleArrowDown } from "react-icons/md";

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
          <h1 className="text-4xl xs:text-6xl md:text-8xl font-bold text-custom-atomic-tangerine transition-all duration-1000 ease-out tracking-wide" style={{ textShadow: '2px 2px 4px rgba(255, 253, 130, 0.5)'}}>
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

      {/* 公開分享行程 */}
      <div className="w-full bg-gray-100 transition-all duration-1000 ease-out">
        <div className="flex justify-center items-center gap-2 mt-2">
          <FaThumbsUp size={32} className="text-custom-kame animate-bounce"/>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-custom-reseda-green pt-4 pb-2">旅友分享行程</h2>
          <FaThumbsUp size={32} className="text-custom-kame animate-bounce -scale-x-100 transform"/>
        </div>
        <PublicTrip />
      </div>

      {/* 網站使用說明 */}
      <div className="flex flex-col justify-center items-center w-full bg-gray-100 transition-all duration-1000 ease-out">
        <div className="flex justify-center items-center gap-1 my-3">
          <MdOutlineKeyboardDoubleArrowDown size={36} className="text-custom-kame animate-bounce font-bold"/>
          <div className="text-2xl sm:text-3xl font-bold text-center text-custom-atomic-tangerine my-2">
          如何開始我的旅遊規劃？
          </div>
          <MdOutlineKeyboardDoubleArrowDown  size={36} className="text-custom-kame animate-bounce font-bold"/>
        </div>
        

        <div className="flex flex-col sm:flex-row gap-2 p-3 w-[90%] justify-center mb-7 bg-white rounded-lg">
          <div className="w-full flex justify-center">
            <Image 
              src="/images/index-instruction-1.gif" 
              width={4} 
              height={2} 
              alt="網站說明1" 
              layout="responsive"
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center text-left items-start w-full p-5 text-custom-atomic-tangerine">
            <span className="font-bold mb-2 text-xl sm:text-2xl lg:text-3xl border-b-2 border-custom-atomic-tangerine">
              STEP 1 - 新增行程：
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl mb-2">
              先建立一個新的行程來開始一切！
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl">
              輸入行程名稱、起迄日期，儲存之後點擊"開始規劃"
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 p-3 w-[90%] justify-center mb-7 bg-white rounded-lg">
          <div className="flex flex-col justify-center text-left items-start w-full p-5 text-custom-atomic-tangerine order-2 sm:order-1">
            <span className="font-bold mb-2 text-xl sm:text-2xl lg:text-3xl border-b-2 border-custom-atomic-tangerine">
              STEP 2 - 搜尋景點：
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl mb-2">
              還不確定要去哪些地方？沒關係！
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl">
              先新增清單來存放景點，在地圖上搜尋景點加入清單，儲存景點後就可以開始規劃
            </span>
          </div>
          <div className="w-full order-1 sm:order-2 flex justify-center">
            <Image 
              src="/images/index-instruction-2.gif" 
              width={4} 
              height={2} 
              alt="網站說明2" 
              layout="responsive"
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 p-3 w-[90%] justify-center mb-10 bg-white rounded-lg">
          <div className="w-full flex justify-center">
            <Image 
              src="/images/index-instruction-3.gif" 
              width={4} 
              height={2} 
              alt="網站說明3" 
              layout="responsive"
              className="object-contain"
            />
          </div>

          <div className="flex flex-col justify-center text-left items-start w-full p-5 text-custom-atomic-tangerine">
            <span className="font-bold mb-2 text-xl sm:text-2xl lg:text-3xl border-b-2 border-custom-atomic-tangerine">
              STEP 3 - 規劃行程：
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl mb-2">
              盡情拖&拉吧！
            </span>
            <span className="text-lg sm:text-xl lg:text-2xl">
              從清單選取景點，在任一日期列表之間拖來拖去，也可以加入行程時間和切換交通方式，完成後記得儲存！
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default HomePage;

