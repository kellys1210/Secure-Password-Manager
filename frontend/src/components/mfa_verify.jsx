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
        <div>
            <h3>Verify Your MFA Code</h3>
            {msg && <p>{msg}</p>}

            <form onSubmit={handleSubmit}>
                <input
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="6-digit code"
                value={code}
                onChange={(e) =>
                   setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
            /> 
            <button type="submit">Verify</button>    
            </form>
        </div>
    );
}