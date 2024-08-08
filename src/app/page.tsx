// "use client";

import React, { useState, useEffect } from "react";
// import Link from "next/link";
import Image from "next/image";
// import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User, signOut } from "../../firebase-config";
// import { useRouter } from "next/navigation";


const HomePage: React.FC = () => {

  return (
    <div className="home-page flex flex-col items-center justify-center text-center">
      <div className="relative w-full h-screen">
      {/* <video
          autoPlay
          loop
          muted
          className="absolute w-full h-full object-cover opacity-45"
        >
          <source src="/videos/sky-1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video> */}
        <Image
          src="/images/Asu-1.jpg" 
          alt="Banner"
          layout="fill" 
          objectFit="cover"
          className="opacity-45" 
        />
          <h1 className="absolute inset-0 flex top-1/3 justify-center text-8xl font-bold text-custom-reseda-green">旅遊 X 拖拉</h1>
          <span className="absolute inset-0 flex top-1/2 justify-center text-2xl">讓我們一點一點開始建立屬於你的行程</span>
      </div>
    </div>
  );
};

export default HomePage;

