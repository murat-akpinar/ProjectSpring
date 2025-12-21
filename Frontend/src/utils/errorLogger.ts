import { logService } from '../services/logService';

let errorLoggerInitialized = false;

export const initializeErrorLogger = () => {
  if (errorLoggerInitialized) {
    return;
  }
  
  errorLoggerInitialized = true;
  
  // Global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = `${message} at ${source}:${lineno}:${colno}`;
    logService.sendFrontendLog('ERROR', errorMessage, error || new Error(message as string));
    return false; // Don't prevent default error handling
  };
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    logService.sendFrontendLog('ERROR', 'Unhandled promise rejection: ' + event.reason, error);
  });
  
  // Console error interceptor (optional, can be disabled)
  const originalError = console.error;
  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logService.sendFrontendLog('ERROR', message);
  };
  
  // Console warn interceptor (optional)
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    logService.sendFrontendLog('WARN', message);
  };
};

