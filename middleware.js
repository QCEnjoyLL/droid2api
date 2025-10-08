import crypto from 'crypto';
import { logInfo, logError, logDebug } from './logger.js';

// Local API key configuration
let localApiKeys = [];
let adminPassword = null;

/**
 * Initialize local authentication from environment variables
 */
export function initializeLocalAuth() {
  // Load local API keys (comma-separated)
  const localKeys = process.env.LOCAL_API_KEYS;
  if (localKeys && localKeys.trim() !== '') {
    localApiKeys = localKeys.split(',').map(key => key.trim()).filter(key => key !== '');
    logInfo(`Local authentication enabled with ${localApiKeys.length} API key(s)`);
  }

  // Load admin password
  adminPassword = process.env.ADMIN_PASSWORD || null;
  if (adminPassword) {
    logInfo('Admin panel password configured');
  }

  return {
    localAuthEnabled: localApiKeys.length > 0,
    adminEnabled: adminPassword !== null
  };
}

/**
 * Middleware to verify local API key
 * Only enforced if LOCAL_API_KEYS is configured
 */
export function verifyLocalApiKey(req, res, next) {
  // Skip verification if no local keys configured
  if (localApiKeys.length === 0) {
    return next();
  }

  // Skip verification for admin endpoints (they have their own auth)
  if (req.path.startsWith('/admin')) {
    return next();
  }

  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logError('Missing authorization header', {
      ip: req.ip,
      path: req.path
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authorization header. Please provide a valid API key.'
    });
  }

  // Extract token (support both "Bearer token" and "token" formats)
  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Verify token against local keys
  if (!localApiKeys.includes(token)) {
    logError('Invalid API key', {
      ip: req.ip,
      path: req.path,
      keyPrefix: token.substring(0, 10) + '...'
    });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key. Access denied.'
    });
  }

  logDebug('Local API key verified', {
    ip: req.ip,
    path: req.path
  });
  next();
}

/**
 * Middleware to verify admin password
 */
export function verifyAdminAuth(req, res, next) {
  // Check if admin password is configured
  if (!adminPassword) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Admin panel is not configured. Please set ADMIN_PASSWORD environment variable.'
    });
  }

  // Get authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
  }

  // Support Basic Auth format: "Basic base64(username:password)"
  if (authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    if (password === adminPassword) {
      logInfo('Admin authenticated', { username, ip: req.ip });
      return next();
    }
  }

  // Support Bearer token format: "Bearer password"
  if (authHeader.startsWith('Bearer ')) {
    const password = authHeader.substring(7);
    if (password === adminPassword) {
      logInfo('Admin authenticated', { ip: req.ip });
      return next();
    }
  }

  // Direct password (no prefix)
  if (authHeader === adminPassword) {
    logInfo('Admin authenticated', { ip: req.ip });
    return next();
  }

  logError('Admin authentication failed', { ip: req.ip });
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Invalid admin credentials'
  });
}

/**
 * Get current local API keys (for admin panel)
 */
export function getLocalApiKeys() {
  return localApiKeys.map((key, index) => ({
    id: index,
    key: key,
    prefix: key.substring(0, 10) + '...',
    createdAt: new Date().toISOString() // Placeholder, would need persistence for real timestamps
  }));
}

/**
 * Add a new local API key
 */
export function addLocalApiKey(key) {
  if (!key || key.trim() === '') {
    throw new Error('Invalid API key');
  }

  const trimmedKey = key.trim();

  if (localApiKeys.includes(trimmedKey)) {
    throw new Error('API key already exists');
  }

  localApiKeys.push(trimmedKey);
  logInfo(`New local API key added (total: ${localApiKeys.length})`);

  return {
    success: true,
    totalKeys: localApiKeys.length
  };
}

/**
 * Remove a local API key
 */
export function removeLocalApiKey(key) {
  const index = localApiKeys.indexOf(key);

  if (index === -1) {
    throw new Error('API key not found');
  }

  localApiKeys.splice(index, 1);
  logInfo(`Local API key removed (total: ${localApiKeys.length})`);

  return {
    success: true,
    totalKeys: localApiKeys.length
  };
}

/**
 * Generate a random API key
 */
export function generateApiKey() {
  const prefix = 'droid2api';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}
