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
    <div>
      <h2>Vault Access Granted</h2>
      <p>This is your secure vault, Manage your passwords below.</p>

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      <VaultSetup />
    </div>
  );
}