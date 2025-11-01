import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storeToken, totpSetup, verifyTotp } from "../utils/auth";

/**
 * Display a QR code for the user to scan with authenticator app. 
 * Will accept the TOTP code and verify to complete MFA setup. 
 * When successful the user will be redirected to the vault
 */

export default function MfaSetup() {
    const [qrUrl, setQrUrl] = useState(null);
    const [code, setCode] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    useEffect (() => {
        const username = localStorage.getItem("login_username");
        if(!username) {
            setMsg("No username in context. Please log in."); 
            return; 
        }

        (async () => {
                const result = await totpSetup(username);
                    if (result.success) {
                        // render QR code
                        const url = URL.createObjectURL(result.qrBlob); 
                        setQrUrl(url);
                    } else {
                        setMsg(result.error); //error message? 
                    }
            })();
    }, []);               

    const activate = async (e) => {
        e.preventDefault();
        setMsg("");
    
        const username = localStorage.getItem("login_username");
        if (!username) return setMsg("No username in context. Please log in.");

        const result = await verifyTotp(username, code);

        if (!result.success) {
            setMsg(result.error);
        } else {
          // auto-login with token
            storeToken(result.data.jwt)
            navigate("/vault")
            localStorage.removeItem("login_username");
            setMsg("MFA enabled. You can now sign in with your code."); 
    }
};  
return (
    <div>
        <h3> Set up MFA (TOTP) </h3>
        {msg && <p>{msg}</p>}
        {qrUrl ? (
            <>
            <img src={qrUrl} alt="Scan with your authenticator app" />
            <form onSubmit={activate} style={{ marginTop: 12}}>
                <input
                    inputMode="numeric"
                    pattern="\d{6}"
                    placeholder="6-digit-code"
                    value={code}
                    onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0,6))
                    }
                    required
                  />
                  <button type="submit">Activate</button>  
            </form>
          </>
        ) : (
            <p>Preparing your QR..</p>
        )}
    </div>
  );
} 
