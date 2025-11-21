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

  useEffect(() => {
    const username = localStorage.getItem("login_username");
    if (!username) {
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

    // Cleanup function to prevent memory leaks
    return () => {
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
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
      storeToken(result.data.jwt);
      navigate("/vault");
      localStorage.removeItem("login_username");
      setMsg("MFA enabled. You can now sign in with your code.");
    }
  };
  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-xl shadow-md mt-6">
      <h3 className="text-3xl font-bold text-brandnavy mb-4 text-center"> 
      Set up MFA (TOTP) </h3>
      {msg && <p
      className="mb-4 text-red-600 text-sm font-medium text-center">{msg}</p>}
      {qrUrl ? (
        <>
          <div className="flex justify-center mb-4">
          <img 
          src={qrUrl} 
          alt="Scan with your authenticator app" 
          className="w-48 h-48 border border-gray-300 rounded-lg shadow"/>
          </div>
          <form onSubmit={activate} className="flex flex-col items-center gap-4">
            <input
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="6-digit-code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required className="w-40 p-2 border border-gray-300 rounded-lg text-center 
              focus:outline-none focus:ring-2 focus:ring-brandnavy"
            />
            <button type="submit" 
            className="w-40 bg-brandnavy text-white py-2 rounded-lg font-semibold 
            hover:bg-opacity-90 transition disabled:opacity-60">
              Activate</button>
          </form>
        </>
      ) : (
        <p className="text-gray-600 text-center">
          Preparing your QR..</p>
      )}
    </div>
  );
}
