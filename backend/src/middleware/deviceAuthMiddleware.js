// backend/src/middleware/deviceAuthMiddleware.js
import dotenv from 'dotenv';

dotenv.config();

// Simple API key authentication for IoT devices
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || '54e636073667fc17bb1d2b2efda22a5e3b6e248b9b07d55c6f1013e63837bebd';

/**
 * Middleware to authenticate IoT devices using API key
 * Devices should send: X-Device-API-Key header
 */
export const authenticateDevice = (req, res, next) => {
  try {
    const apiKey = req.headers['x-device-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Device authentication required',
        message: 'No API key provided. Send X-Device-API-Key header.' 
      });
    }

    if (apiKey !== DEVICE_API_KEY) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'Device API key is invalid'
      });
    }

    // Attach device info to request
    req.device = {
      authenticated: true,
      type: 'iot-sensor',
    };
    
    next();
  } catch (error) {
    console.error('Device auth error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: error.message 
    });
  }
};

/**
 * Middleware that allows either user auth OR device auth
 * For endpoints that both users and devices can access
 */
export const authenticateUserOrDevice = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const deviceKey = req.headers['x-device-api-key'];

  // Try device authentication first
  if (deviceKey) {
    if (deviceKey === DEVICE_API_KEY) {
      req.device = { authenticated: true, type: 'iot-sensor' };
      return next();
    } else {
      return res.status(401).json({ 
        error: 'Invalid device API key'
      });
    }
  }

  // Try user authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Import here to avoid circular dependency
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('User auth error:', error);
    }
  }

  // No valid authentication
  return res.status(401).json({ 
    error: 'Authentication required',
    message: 'Provide either Bearer token or X-Device-API-Key header'
  });
};