import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyTotp, storeToken } from "../utils/auth";

/**
 * Prompt the user to enter TOTP code after the user has been authenticated.
 * When successful the JWT token is stored and the user is redirected to the vault.
 */
export default function MfaVerify() {
    const [code, setCode] = useState("");
    const [msg, setMsg]   = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");

        const username = localStorage.getItem("login_username");
        if (!username) return setMsg("No username in found. Please log in.");

        const result = await verifyTotp(username, code);

        if (result.success) {
            storeToken(result.data.jwt);
            localStorage.removeItem("login_username");
            navigate("/vault");
       } else {
         setMsg(result.error);
       }
    };

    return (
        <div
        className="w-full max-w-md mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
            <h3 className="text-2xl font-bold text-brandnavy mb-4 text-center">
                Verify Your MFA Code</h3>
            {msg && <p className="mb-4 text-red-600 text-sm font-medium text-center">
                {msg}</p>}

            <form onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4">
                <input
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="6-digit code"
                value={code}
                onChange={(e) =>
                   setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className="w-40 p-2 border border-gray-300 rounded-lg text-center 
                   focus:outline-none focus:ring-2 focus:ring-brandnavy"
            /> 
            <button type="submit"
            className="w-40 bg-brandnavy text-white py-2 rounded-lg font-semibold 
            hover:bg-opacity-90 transition disabled:opacity-60">
                Verify</button>
            </form>
        </div>
    );
}