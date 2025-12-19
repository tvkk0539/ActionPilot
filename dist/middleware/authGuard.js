"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = authGuard;
function authGuard(req, res, next) {
    if (!req.session || !req.session.user) {
        // If it's an API call, return 401
        if (req.path.startsWith('/api') || req.xhr) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Otherwise redirect to login
        return res.redirect('/login');
    }
    // Optional: Check allowed users list
    const allowedUsers = (process.env.ALLOWED_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
    // We check against the current session username (active account or login account)
    // Warning: If user switches to an account that is NOT in the allowlist, should we block them?
    // Or is the allowlist only for the "Login" user?
    // Let's assume allowlist applies to the authenticated session.
    if (allowedUsers.length > 0 && !allowedUsers.includes(req.session.user.username)) {
        if (req.path.startsWith('/api') || req.xhr) {
            return res.status(403).json({ error: 'Access Denied: User not in allowlist' });
        }
        return res.status(403).send('Access Denied: You are not authorized.');
    }
    next();
}
