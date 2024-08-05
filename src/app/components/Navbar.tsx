import React from "react";
import Link from "next/link";

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-[rgb(165,222,228)] shadow-md flex justify-between items-center px-4 py-2 z-10">
      <div className="text-2xl font-bold">
        <Link href="/">旅遊 X 拖拉</Link>
      </div>
      <div className="space-x-4">
        <Link href="/signup">
          會員註冊
        </Link>
        <Link href="/login">
          會員登入
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
