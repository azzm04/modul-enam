// backend/src/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for backend
);

/**
 * Middleware to verify Supabase JWT token
 * Attaches user info to req.user if valid
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Allow trusted sensor simulator to authenticate via a shared API key
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['x_api_key'];
    if (apiKeyHeader && process.env.SENSOR_API_KEY && apiKeyHeader === process.env.SENSOR_API_KEY) {
      req.user = { id: 'sensor-simulator', role: 'service' };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: error?.message || 'Token verification failed'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: error.message 
    });
  }
};

/**
 * Optional auth middleware - allows both authenticated and guest access
 * If token is present, verifies it and attaches user
 * If no token, continues without user
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Allow trusted sensor simulator via API key
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['x_api_key'];
    if (apiKeyHeader && process.env.SENSOR_API_KEY && apiKeyHeader === process.env.SENSOR_API_KEY) {
      req.user = { id: 'sensor-simulator', role: 'service' };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue as guest
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};