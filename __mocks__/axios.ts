/**
 * Axios Mock for Testing
 */

const isAxiosError = (error: any): boolean => {
  return error && error.isAxiosError === true;
};

const axios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  isAxiosError,
  create: jest.fn(() => axios),
};

export default axios;
export { isAxiosError };
