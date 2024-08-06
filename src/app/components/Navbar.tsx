"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  auth,
  signOut,
  User,
  onAuthStateChanged,
} from "../../../firebase-config";
import Authmodal from "./Authmodal";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("登出成功");
      router.push("/");
    } catch (error: any) {
      console.error("Error signing out:", error);
      alert(error.message);
    }
  };

  const handleAuthToggle = () => {
    setShowModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-custom-kame shadow-md flex justify-between items-center px-4 py-2 z-10">
        <div className="text-2xl font-bold">
          <Link href="/">旅遊 X 拖拉</Link>
        </div>
        <div className="space-x-4">
          {user ? (
            <>
              <Link href="/trips">行程管理</Link>
              <button onClick={handleSignOut}>會員登出</button>
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
          <Authmodal onClose={() => setShowModal(false)} />
        </div>
      )}
    </>
  );
};

export default Navbar;
