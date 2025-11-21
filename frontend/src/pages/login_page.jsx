import React from "react";
import LoginForm from "../components/login_form.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-brandnavy mb-5"
        >Secure Password Manager</h1>
        <img src="/logo.png" alt="App Logo" className="w-24 h-24 mb-6" />
        <h2 className="text-3xl font-bold text-brandnavy mb-2"
        >Login</h2>
        <LoginForm />
        
        <button
            type="button"
             onClick={() => navigate("/about")}
             className="mt-4 text-brandnavy underline font-medium hover:text-brandnavy/70"
             >
                About Us
        </button>
    </div>
    );
}