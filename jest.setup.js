// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js environment (required for cheerio/undici)
import { TextEncoder, TextDecoder } from 'util';

// Check if we're in Node.js environment and need polyfills
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Polyfill for web streams (required by undici which is used by cheerio)
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream: NodeReadableStream } = require('stream/web');
  global.ReadableStream = NodeReadableStream;
}
if (typeof global.TransformStream === 'undefined') {
  const { TransformStream: NodeTransformStream } = require('stream/web');
  global.TransformStream = NodeTransformStream;
}

// Polyfill MessagePort (required by undici)
if (typeof global.MessagePort === 'undefined') {
  const { MessageChannel } = require('worker_threads');
  global.MessagePort = MessageChannel.prototype.constructor;
  global.MessageChannel = MessageChannel;
}

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CHABAD_UNIVERSE_URL = 'https://chabaduniverse.com';
process.env.CHABAD_UNIVERSE_API_KEY = 'test-api-key';
process.env.CHABAD_UNIVERSE_CHANNEL_ID = 'test-channel-id';
process.env.ARCHIVE_BASE_URL = 'https://merkos-living.s3.us-west-2.amazonaws.com';
process.env.MONGODB_URI = 'mongodb://localhost:27017/living-with-rebbe-test';
process.env.NODE_ENV = 'test';
process.env.MOCK_ENV = 'test';
