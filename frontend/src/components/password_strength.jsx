// https://www.geeksforgeeks.org/dsa/program-check-strength-password/

import React from "react";
import { useState } from "react";

/* * *
 * A password generator that will check for strength. 
 * * */


// Password strength checker
export function checkPasswordStrength(password) {
  const n = password.length;

  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let specialChar = false;
  
  const normalChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 ";

  for (let i = 0; i < n; i++) {
    if (password[i] >= "a" && password[i] <= "z") hasLower = true;
    if (password[i] >= "A" && password[i] <= "Z") hasUpper = true;
    if (password[i] >= "0" && password[i] <= "9") hasDigit = true;
    if (!normalChars.includes(password[i])) specialChar = true;
  }

  if (hasLower && hasUpper && hasDigit 
    && specialChar && n >= 8) return "Strong";
  if ((hasLower || hasUpper) 
    && specialChar && n >= 6) return "Moderate";
  return "Weak";
}


// Random generator
export function generatePassword(length = 12) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let pwd = "";

  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }

  return pwd;
}

export default function PasswordStrength() {
  const [password, setPassword] = useState("");
  const strength = checkPasswordStrength(password);

  // Color indicators
  const strengthColor = {
    Weak: "text-red-600",
    Moderate: "text-yellow-600",
    Strong: "text-green-600",
  }[strength];

  const handleGenerate = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
  };
  

  // Button to generate password with strength indicator 
  return (
    <div className="max-w-md p-4 bg-white rounded-xl shadow-md space-y-4">
      <h3 className="text-lg font-bold text-brandnavy">
        Password Generator
      </h3>

      
      <input
        type="text"
        className="w-full p-2 border rounded-lg"
        value={password}
        placeholder="Enter or generate password..."
        onChange={(e) => setPassword(e.target.value)}
      />

      {password && (
        <p className={`font-semibold ${strengthColor}`}>
          Strength: {strength}
        </p>
      )}

      <button
        onClick={handleGenerate}
        className="bg-brandnavy text-white px-4 py-2 rounded-lg hover:bg-opacity-90" >
        Generate Strong Password
      </button>
    </div>
  );
}