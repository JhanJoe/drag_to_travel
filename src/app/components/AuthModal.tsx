"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "../../../firebase-config";
import { useLoading } from "../contexts/LoadingContext";

interface AuthModalProps {
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const [isSignUp, setIsSignUp] = useState(false); //預設為登入表單
    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [statusMessage, setStatusMessage] = useState("  "); // 註冊/登入後顯示訊息
    const [statusColor, setStatusColor] = useState("text-green-500"); // 訊息顏色，預設為綠色（成功）；反之為紅色（error）
    const { startLoading, stopLoading } = useLoading(); //使用LoadingContext
    // const router = useRouter();

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
            setStatusMessage("註冊成功");
            setStatusColor("text-green-500"); 
            setSignUpEmail("");
            setSignUpPassword("");
            setIsSignUp(false);
            setTimeout(() => {
                onClose();
                window.location.href = '/trips';
            }, 1000);
        } catch (error: any) {
            console.error("Error signing up:", error);
            setStatusMessage(`註冊失敗: ${error.message}`);
            setStatusColor("text-red-500"); 
        }
    };

    const handleSignIn = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
            startLoading("登入成功，請稍候...");
            localStorage.setItem('isLoading', 'true'); // Set loading flag
            setTimeout(() => {
                onClose();
                window.location.href = '/trips';
            }, 1000);
        } catch (error: any) {
            console.error("Error signing in:", error);
            setStatusMessage(`登入失敗: ${error.message}`);
            setStatusColor("text-red-500"); 
            stopLoading(); 
            }
    };

    const handleTestAccountSignIn = async () => {
        setSignInEmail("example@email.com");
        setSignInPassword("example");
        try {
            await signInWithEmailAndPassword(auth, "example@email.com", "example");
            startLoading("登入成功，請稍候...");
            localStorage.setItem('isLoading', 'true');
            setTimeout(() => {
                onClose();
                window.location.href = '/trips';
            }, 1000);
        } catch (error: any) {
            console.error("Error signing in with test account:", error);
            setStatusMessage(`登入失敗: ${error.message}`);
            setStatusColor("text-red-500"); 
            stopLoading(); 
        }
    };

    return (
        <>
            <div className="relative bg-white rounded-lg shadow-lg p-6 w-[350px]">
            {isSignUp ? (
                <form onSubmit={handleSignUp} className="flex flex-col h-full relative">
                    <h2 className="text-3xl mb-4 text-center">註冊</h2>
                    <input
                        type="email"
                        placeholder="Email"
                        className="mb-4 p-2 border rounded"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="mb-6 p-2 border rounded"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-custom-kame text-gray-600 font-bold py-2 rounded transition-all duration-300 z-30 active:scale-95 active:shadow-inner hover:bg-custom-atomic-tangerine hover:text-white"
                    >
                        註冊
                    </button>

                    {statusMessage && (
                        <p className={`mt-2 ${statusColor} text-center`}>{statusMessage}</p>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="mt-3 text-gray-500 hover:underline"
                    >
                        已有帳號？ 請點擊登入
                    </button>

                    <button
                    type="button"
                    onClick={handleTestAccountSignIn}
                    className="mt-3 text-gray-500"
                >
                    使用測試帳號登入
                </button>
                </form>
            ) : (
            <form onSubmit={handleSignIn} className="flex flex-col h-full relative">
                <h2 className="text-3xl mb-4 text-center">登入</h2>
                <input
                    type="email"
                    placeholder="Email"
                    className="mb-4 p-2 border rounded"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="mb-6 p-2 border rounded"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                />
                <button type="submit" className="bg-custom-kame text-gray-600 font-bold py-2 rounded transition-all duration-300 z-30 active:scale-95 active:shadow-inner hover:bg-custom-atomic-tangerine hover:text-white">
                    登入
                </button>

                {statusMessage && (
                    <p className={`mt-2 justify-center ${statusColor} text-center`}>{statusMessage}</p>
                )}
                <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="mt-3 text-gray-500 hover:underline"
                >
                    沒有帳號？ 請點擊註冊
                </button>

                <button
                    type="button"
                    onClick={handleTestAccountSignIn}
                    className="mt-3 text-gray-500 hover:underline"
                >
                    使用測試帳號登入
                </button>

                </form>
            )}
            <button onClick={onClose} className="absolute top-2 right-4 text-3xl">
                &times;
            </button>
            </div>
    </>
    );
};

export default AuthModal;
