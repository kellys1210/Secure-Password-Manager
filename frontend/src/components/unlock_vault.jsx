import React from "react";
import PropTypes from "prop-types";

/* * *
 * Vault Access form for user to gain 
 * access with their master password in vault_setup 
 * * */

const UnlockVault = ({
  masterPassword,
  setMasterPassword,
  unlockError,
  handleUnlock,
}) => {
  return (
    <div className="max-w-sm mx-auto mt-12 bg-white p-6 shadow-md rounded-xl">
      <h2 className="text-xl font-bold text-brandnavy mb-4">
        Unlock Your Vault
      </h2>

      {unlockError && (
        <p className="text-red-600 mb-3">{unlockError}</p>
      )}

      <input
        type="password"
        placeholder="Master Password"
        value={masterPassword}
        onChange={(e) => setMasterPassword(e.target.value)}
        className="w-full p-2 mb-4 border rounded-lg"
      />

      <button
        onClick={handleUnlock}
        className="w-full bg-brandnavy text-white py-2 rounded-lg font-semibold"
      >
        Unlock Vault
      </button>
    </div>
  );
}

UnlockVault.propTypes = {
  masterPassword: PropTypes.string.isRequired,
  setMasterPassword: PropTypes.func.isRequired,
  unlockError: PropTypes.string,
  handleUnlock: PropTypes.func.isRequired,
};

export default UnlockVault;