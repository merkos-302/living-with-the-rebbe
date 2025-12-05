/**
 * Mock Valu API for Jest tests
 */

export class Intent {
  serviceName: string;
  action: string;
  params: any;

  constructor(serviceName: string, action: string, params: any = {}) {
    this.serviceName = serviceName;
    this.action = action;
    this.params = params;
  }
}

export class ValuApi {
  callService = jest.fn();
  getApi = jest.fn();
  runConsoleCommand = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();

  static API_READY = 'api-ready';
}

export default ValuApi;
