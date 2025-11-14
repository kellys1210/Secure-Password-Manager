module.exports = {
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["dotenv/config", "<rootDir>/src/test-setup.js"],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};
