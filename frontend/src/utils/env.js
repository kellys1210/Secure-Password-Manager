// https://www.browserstack.com/guide/jest-env

// Retrieve an enviorment variable across Vite and Node enviorments. 
// Created for Jest test parsing of import.meta
export function getEnvVar(name, defaultValue = "") {
    try {
    // Avoid Jest syntax error 
      const viteEnv = (() => {
        try {
          return eval("import.meta.env");
        } catch {
          return undefined;
        }
      })();
      
      // Return vite enviornment if available
      if (viteEnv && viteEnv[name] !== undefined) {
        return viteEnv[name];
      }
      
      // fallback to node enviornment variables for testing/runtime
      if (typeof process !== "undefined" && process.env?.[name] !== undefined) {
        return process.env[name];
      }
      
      // return the provided default if variable not found or not accessed
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }