/**
 * Logging utilities for Valu API integration
 * Based on universe-portal implementation
 */

// Integration logger for Valu API events
export const integrationLog = {
  valu: {
    event: (eventType: string, data?: any) => {
      console.log(`[VALU] ${eventType}`, data);
    },
  },
};

// Auth logger for authentication events
export const authLogger = {
  debug: (message: string, data?: any) => {
    console.debug(`[AUTH] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.info(`[AUTH] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[AUTH] ${message}`, data);
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(`[AUTH] ${message}`, error, data);
  },
};

// Auth log for specific auth events
export const authLog = {
  loginAttempt: (method: string, identifier: string, success: boolean, data?: any) => {
    console.log(`[AUTH] Login attempt: ${method}`, { identifier, success, ...data });
  },
  tokenValidation: (valid: boolean, method: string, data?: any) => {
    console.log(`[AUTH] Token validation: ${method}`, { valid, ...data });
  },
};
