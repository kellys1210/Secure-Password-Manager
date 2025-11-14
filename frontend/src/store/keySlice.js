// https://dev.to/sergiusac/secure-note-manager-in-react-part-2-client-side-login-with-web-crypto-and-redux-41b8


// This slice securely manages the cryptographic secret key
// user for client encryrption/decryption for the login and vault
// The key exists on in memory during the active session 
// When the user logs out or reloads the page the key is cleared.
// The key won't be written to local storage and dissapears when app is closed/reloaded

// Make the key available globally using redux
import { createSlice } from '@reduxjs/toolkit';

// Key is not stored till user logs in
const initialState = {
    key: null,
};

// Create actions and reducers
export const secretKeySlice = createSlice ({
    name: 'secretKey',
    initialState, 
    reducers: {
        // store the CryptoKey in memory after successful login and vault access.
        setSecretKey(state, action) {
            state.key = action.payload;
        },
        // Clear the key from memory
        clearSecretKey(state) {
            state.key = null;
        },
    },
});

// export the redux actions 
export const { setSecretKey, clearSecretKey } = secretKeySlice.actions;
// export reducer 
export default secretKeySlice.reducer;