"use client";

import { useState } from "react";
import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "../../../firebase-config";

interface AuthModalProps {
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const [isSignUp, setIsSignUp] = useState(false); //預設為登入表單
    const [signInEmail, setSignInEmail] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [signUpEmail, setSignUpEmail] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
            alert("註冊成功");
            setSignUpEmail("");
            setSignUpPassword("");
            setIsSignUp(false);
        } catch (error: any) {
            console.error("Error signing up:", error);
            alert(error.message);
        }
    };

    const handleSignIn = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
            alert("登入成功");
            setSignInEmail("");
            setSignInPassword("");
            onClose();
            } catch (error: any) {
            console.error("Error signing in:", error);
            alert(error.message);
            }
    };

    return (
        <div className="relative bg-white rounded-lg shadow-lg p-6 w-[350px] h-[320px]">
        {isSignUp ? (
            <form onSubmit={handleSignUp} className="flex flex-col h-full relative">
                {/* <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-custom-1"></div>  TODO 漸變顏色條 尚未調整*/}
                
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
                    className="bg-custom-kame text-custom-dark-green font-bold py-2 rounded"
                >
                    註冊
                </button>
                <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="mt-6 text-custom-dark-green"
                >
                    已有帳號？ 請點擊登入
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
            <button type="submit" className="bg-custom-kame font-bold py-2 rounded">
                登入
            </button>
            <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="mt-6 text-custom-dark-green"
            >
                沒有帳號？ 請點擊註冊
            </button>
            </form>
        )}
        <button onClick={onClose} className="absolute top-2 right-4 text-3xl">
            &times;
        </button>
        </div>
    );
};

export default AuthModal;
