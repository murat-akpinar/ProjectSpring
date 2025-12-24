/**
 * JWT token utility functions
 * Used to decode and check JWT token expiration
 */

interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodes a JWT token without verification
 * Note: This only decodes the token, it does not verify the signature
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeJwtToken = (token: string): JwtPayload | null => {
  try {
    // JWT tokens have 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64URL decode
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode from base64
    const decoded = atob(padded);
    
    // Parse JSON
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
};

/**
 * Gets the expiration time of a JWT token
 * @param token - JWT token string
 * @returns Expiration time as Date or null if invalid
 */
export const getTokenExpiration = (token: string | null): Date | null => {
  if (!token) {
    return null;
  }

  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // exp is in seconds, convert to milliseconds
  return new Date(payload.exp * 1000);
};

/**
 * Gets the time remaining until token expiration in milliseconds
 * @param token - JWT token string
 * @returns Time remaining in milliseconds, or 0 if expired/invalid
 */
export const getTokenTimeRemaining = (token: string | null): number => {
  if (!token) {
    return 0;
  }

  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return 0;
  }

  const remaining = expiration.getTime() - Date.now();
  return Math.max(0, remaining);
};

