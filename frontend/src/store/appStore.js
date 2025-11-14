// https://dev.to/sergiusac/secure-note-manager-in-react-part-2-client-side-login-with-web-crypto-and-redux-41b8
// https://stackoverflow.com/questions/61704805/getting-an-error-a-non-serializable-value-was-detected-in-the-state-when-using

// Setup the redux store to manage global state across the application 
// The keySlice will handle in-memory storage for the user's
// cryptographic key. 

import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit';
import secretKeyReducer from './keySlice.js';

// Create and configure the redux store
export const store = configureStore({
    reducer: {
        secretKey: secretKeyReducer,
    },
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["secretKey/setSecretKey"],
                ignoredPaths: ["secretKey.key"],
            },
            immutableCheck: false,
        }),
});
