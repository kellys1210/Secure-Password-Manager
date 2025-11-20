import React from "react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
        <div className="w-full max-w-3xl bg-white p-6 mt-8 rounded-xl shadow-lg space-y-8">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brandnavy mb-2">About Secure Password Manager</h1>
        <p className="text-gray-600">
          A simple, secure, zero-knowledge password vault designed to help you manager all of your passwords.
        </p>
      </div>

      {/* How It Works */}
      <section>
        <h2 className="text-xl font-semibold text-brandnavy mb-2"> How the Vault Works</h2>
        <p className="text-gray-700 leading-relaxed">
          Your vault uses strong, modern cryptography built directly into your browser. 
          Everything is encrypted <strong>before</strong> it is sent to the server, and only 
          your master password can unlock it.
        </p>

        <p className="text-gray-700 leading-relaxed mt-3">
          When you unlock your vault, your browser turns your master password into an 
          encryption key using <strong>PBKDF2</strong>.
          That key is then used with <strong>AES-GCM</strong> to decrypt your saved entries.
        </p>
      </section>

      {/* Flow Diagram (text-based) */}
      <section className="bg-gray-50 p-4 rounded-lg border space-y-2">
        <h3 className="text-lg font-semibold text-brandnavy"> Encryption Flow</h3>

        <div className="space-y-1 text-gray-700">
          <p><strong>1. Unlock:</strong> You enter your master password.</p>
          <p className="ml-4">- PBKDF2 derives a secure encryption key.</p>
          <p><strong>2. Decrypt:</strong> The app uses that key to open your vault.</p>
          <p className="ml-4"> - AES-GCM decrypts each password entry.</p>
          <p><strong>3. Use:</strong> Once unlocked, you can view, copy, edit, or manage your passwords.</p>
          <p><strong>4. Encrypt:</strong> Any new or updated entry is encrypted again before being saved.</p>
          <p className="ml-4">- Each entry gets its own salt + IV for maximum security.</p>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-xl font-semibold text-brandnavy mb-2">Features</h2>

        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <strong>Password Strength Checker:</strong> Get real-time feedback on how strong your password is.
          </li>
          <li>
            <strong>Password Generator:</strong> Create a secure password with one click.
          </li>
          <li>
            <strong>Copy to Clipboard:</strong> Quickly copy any password without revealing it on screen.
          </li>
          <li>
            <strong>Client-Side Security:</strong> All encryption and decryption happen in your browser.
          </li>
          <li>
            <strong>Full Password Management:</strong> Add, edit, update, and delete entries easily.
          </li>
          <li>
            <strong>Zero-Knowledge Design:</strong> Only you can decrypt your data. Even the server can't see your passwords.
          </li>
        </ul>
      </section>

      {/* Footer */}
      <div className="text-center pt-4 border-t">
        <p className="text-gray-600 text-sm">
          Secure Password Manager
        </p>
      </div>
    </div>
</div>
  );
}