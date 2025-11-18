import React from "react";
import MfaSetup from "../components/mfa_setup";

export default function SetupMfaPage() {
    return (
        <div 
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
            <img src="/logo.png" alt="App Logo" className="w-24 h-24 mb-6" />
            <h1 className="text-4xl font-bold text-brandnavy mb-5">
                Multi-Factor Authentication Setup</h1>
            <MfaSetup />
        </div>
    );
}