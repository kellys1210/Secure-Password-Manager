// https://dev.to/sergiusac/secure-note-manager-in-react-part-2-client-side-login-with-web-crypto-and-redux-41b8


// Text enconding and decoding
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const cryptoUtils = {
    
    /**
     * 
     * Use PBKDFT to derive a symmetric encrytion key from the salt and master password
     */
    async deriveSecretKey(masterPassword, passwordSalt) { 
        // import the raw password into a CryptoKey
        const masterKey = await crypto.subtle.importKey(
        "raw",
        textEncoder.encode(masterPassword),
        { name: "PBKDF2"}, 
        false, 
        ["deriveKey"]
    );
    
    // use PBKDF2 to derive 256 bit AES-GCM key
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: passwordSalt,
            iterations: 100000, 
            hash: "SHA-256"
        },
        masterKey,
        { name: "AES-GCM", length: 256 }, 
        true,
        ["encrypt", "decrypt"]
    );

    },
    
    /**
     * 
     * Encrypts a plaintext string using AES-GCM with the CryptoKey
     */
    async encryptText(key, plaintext){
        // Generate a random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Perform encryption
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv},
            key,
            textEncoder.encode(plaintext)
        );

        const ivBase64 = this.arrayBufferToBase64(iv.buffer);
        const ciphertextBase64 = this.arrayBufferToBase64(encrypted);
        
        // combine iv and ciphertext for the password in the DB.
        return `${ivBase64}:${ciphertextBase64}`;
    },
    
    /**
     * 
     * Decrypt a AES-GCM ciphertext using the provided key and IV
     */
    async decryptText(key, combined){
        const [ivBase64, ciphertextBase64] = combined.split(":");
        if (!ivBase64 || !ciphertextBase64) throw new Error("Invalid encrypted format");
        
        const iv = this.base64toArrayBuffer(ivBase64);
        const ciphertext = this.base64toArrayBuffer(ciphertextBase64);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key, 
            ciphertext
        );

        return textDecoder.decode(decrypted);
    },
    
    /**
     * 
     * Export the CryptoKey to a raw ArrayBuffer 
     */
    async exportKey(key) {
        return crypto.subtle.exportKey("raw", key);
    }, 
    
    /**
     * Compute a SHA-512 hash from the input and return it as base64
     */
    async digestAsBase(input) {
        const data = 
            typeof input === "string" ? textEncoder.encode(input) : input;
        const hash = await crypto.subtle.digest("SHA-512", data);
        return this.arrayBufferToBase64(hash);
    }, 
    
    // Generate a random salt as an ArrayBuffer
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(16)).buffer;
    },
    
    // Generate a random salt and send it as a base64 string for storage. 
    generateSaltAsBase64() {
       const salt = crypto.getRandomValues(new Uint8Array(16));
       return btoa(String.fromCharCode(...salt));
    }, 
    
    // Convert an ArrayBuffer to a base64 string 
    arrayBufferToBase64(arr) {
        return btoa(String.fromCharCode(...new Uint8Array(arr)));
    },
    
    // Convert a base64 string back to an Arraybuffer
    base64toArrayBuffer(base64) {
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
    },
};
