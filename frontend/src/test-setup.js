import "@testing-library/jest-dom";

// Mock fetch globally for all tests - will be overridden in individual tests
global.fetch = jest.fn();
