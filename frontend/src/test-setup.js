import "@testing-library/jest-dom";

// Mock global.fetch for all tests
global.fetch = jest.fn();

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
