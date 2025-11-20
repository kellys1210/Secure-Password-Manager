import React from "react";
import RegisterForm from "../components/register_form.jsx"

export default function RegisterPage() {
    return (
        <div 
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
            <img src="/logo.png" alt="App Logo" className="w-24 h-24 mb-6" />
            <h1 className="text-4xl font-bold text-brandnavy mb-5"
            >Create an account</h1>
            <RegisterForm />
        </div>
    );
}