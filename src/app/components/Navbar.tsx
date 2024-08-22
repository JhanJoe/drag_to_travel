"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, signOut, User, onAuthStateChanged,} from "../../../firebase-config";
import AuthModal from "./AuthModal";
import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false); //icon hover效果
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error: any) {
      console.error("Error signing out:", error);
    }
  };

  const handleAuthToggle = () => {
    setShowModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md flex justify-between items-center px-4 py-2 z-30">
        <div className="flex items-center text-2xl font-bold text-custom-reseda-green">
          <Link href="/">
              <div 
                className="mr-2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
            <Image 
              src={isHovered ? "/images/icon-192-2.png" : "/images/icon-192.png"} 
              alt="Icon" 
              width={36} 
              height={36} 
              className="transition-transform duration-300 ease-in-out transform hover:scale-110"
            />
            </div>
          </Link>

          <Link href="/" className="hover:text-custom-atomic-tangerine">旅遊 X 拖拉</Link>
        </div>
        <div className="space-x-4">
          {user ? (
            <>
              <span className="text-custom-reseda-green">歡迎，{user.email}</span>
              <Link href="/trips" className="bg-custom-kame p-2 rounded text-gray-600 hover:bg-custom-atomic-tangerine hover:text-white ">建立/選擇行程</Link>
              <button onClick={handleSignOut} className="text-custom-reseda-green hover:text-custom-salmon" >會員登出</button>
            </>
          ) : (
            <>
              <button onClick={handleAuthToggle}>會員登入/註冊</button>
            </>
          )}
        </div>
      </nav>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AuthModal onClose={() => setShowModal(false)} />
        </div>
      )}
    </>
  );
};

export default Navbar;
