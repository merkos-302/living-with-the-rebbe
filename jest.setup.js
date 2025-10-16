// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CHABAD_UNIVERSE_URL = 'https://chabaduniverse.com';
process.env.CHABAD_UNIVERSE_API_KEY = 'test-api-key';
process.env.CHABAD_UNIVERSE_CHANNEL_ID = 'test-channel-id';
process.env.ARCHIVE_BASE_URL = 'https://merkos-living.s3.us-west-2.amazonaws.com';
process.env.MONGODB_URI = 'mongodb://localhost:27017/living-with-rebbe-test';
process.env.NODE_ENV = 'test';
process.env.MOCK_ENV = 'test';
