/** @type {import('jest').Config} */
export default {
  transform: {
    "^.+\\.(js|jsx)$": ["babel-jest", { rootMode: "upward" }],
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  transformIgnorePatterns: ["/node_modules/(?!(@mui|@emotion|recharts)/)"],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx}",
  ],
  moduleFileExtensions: ["js", "jsx"],
  testPathIgnorePatterns: ["/node_modules/"],
  verbose: true,
};
