import { logService } from '../services/logService';
import { authService } from '../services/authService';

let errorLoggerInitialized = false;
let isLoggingEnabled = false;

// Helper function to check if logging should be enabled
const shouldLog = (): boolean => {
  // Only log if user is authenticated
  return authService.isAuthenticated();
};

export const initializeErrorLogger = () => {
  if (errorLoggerInitialized) {
    return;
  }
  
  errorLoggerInitialized = true;
  
  // Check authentication status periodically and enable/disable logging
  const checkAuthStatus = () => {
    isLoggingEnabled = shouldLog();
  };
  
  // Check initially
  checkAuthStatus();
  
  // Check on storage events (when token is set/removed in another tab)
  window.addEventListener('storage', checkAuthStatus);
  
  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    if (!isLoggingEnabled) {
      return false; // Don't prevent default error handling
    }
    try {
      const errorMessage = `${message} at ${source}:${lineno}:${colno}`;
      logService.sendFrontendLog('ERROR', errorMessage, error || new Error(message as string));
    } catch (e) {
      // Silently fail to avoid infinite loop
    }
    return false; // Don't prevent default error handling
  };
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    if (!isLoggingEnabled) {
      return;
    }
    try {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      logService.sendFrontendLog('ERROR', 'Unhandled promise rejection: ' + event.reason, error);
    } catch (e) {
      // Silently fail to avoid infinite loop
    }
  });
  
  // Console error interceptor (optional, can be disabled)
  const originalError = console.error;
  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    if (!isLoggingEnabled) {
      return;
    }
    try {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      // Skip logging if message is about failed log sending to avoid loop
      if (message.includes('Failed to send frontend log') || 
          message.includes('/admin/logs/system/frontend')) {
        return;
      }
      logService.sendFrontendLog('ERROR', message);
    } catch (e) {
      // Silently fail to avoid infinite loop
    }
  };
  
  // Console warn interceptor (optional)
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
    if (!isLoggingEnabled) {
      return;
    }
    try {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      // Skip logging if message is about failed log sending to avoid loop
      if (message.includes('Failed to send frontend log') || 
          message.includes('/admin/logs/system/frontend') ||
          message.includes('No token found')) {
        return;
      }
      logService.sendFrontendLog('WARN', message);
    } catch (e) {
      // Silently fail to avoid infinite loop
    }
  };
};

