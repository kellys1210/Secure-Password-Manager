import React from "react";
import VaultSetup from "../components/vault_setup";
import { removeToken } from "../utils/auth";;
import { useNavigate } from "react-router-dom";

export default function VaultPage() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div
    className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="App Logo" className="w-24 h-24 mb-6" />
      <h2 className="text-4xl font-bold text-brandnavy mb-2">Vault Access Granted</h2>
      <p className="text-2xl font-bold text-brandnavy mb-6">
        This is your secure vault, Manage your passwords below.</p>

      <button onClick={handleLogout}
      className="px-4 py-2 mb-6 bg-brandnavy text-white rounded-lg hover:bg-opacity-90 font-semibold">
        Logout
      </button>

      <hr className="w-full max-w-xl mb-6 border-gray-300" />

      <VaultSetup />
    </div>
  );
}