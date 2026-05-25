/**
 * Role Guard Middleware
 * Usage: router.get('/admin-only', authenticate, roleGuard('admin','owner'), handler)
 */

const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT and attaches req.user.
 * Must be used before roleGuard.
 */
function authenticate(req, res, next) {
  // Accept token from httpOnly cookie first, fall back to Authorization header
  const cookieToken = req.cookies?.auth_session;
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ message: 'Unauthorized — no token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized — invalid token' });
  }
}

/**
 * Restricts access to the specified roles.
 * @param {...string} allowedRoles
 */
function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden — requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

/**
 * Ensures the user belongs to the institute they are accessing.
 * Compares req.user.institute_uuid with req.params.institute_uuid or req.body.institute_uuid.
 */
function sameInstitute(req, res, next) {
  const target = req.params.institute_uuid || req.body?.institute_uuid || req.query?.institute_uuid;
  if (target && req.user?.institute_uuid !== target) {
    return res.status(403).json({ message: 'Forbidden — cross-institute access denied' });
  }
  next();
}

module.exports = { authenticate, roleGuard, sameInstitute };
