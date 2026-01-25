const supabase = require("../services/supabase");

/**
 * Middleware to verify Supabase JWT token.
 * Extracts user from Authorization header and attaches to req.user
 */
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Missing or invalid Authorization header"
            });
        }

        const token = authHeader.split("Bearer ")[1];

        // Verify the JWT with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid or expired token"
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Authentication failed" });
    }
}

/**
 * Middleware to require assistant role.
 * Must be used AFTER verifyToken middleware.
 */
async function requireAssistant(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        // Fetch user profile to check role
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", req.user.id)
            .single();

        if (error || !profile) {
            return res.status(403).json({
                error: "Forbidden",
                message: "User profile not found"
            });
        }

        if (profile.role !== "assistant") {
            return res.status(403).json({
                error: "Forbidden",
                message: "Assistant role required"
            });
        }

        req.userRole = profile.role;
        next();
    } catch (error) {
        console.error("Role check error:", error);
        return res.status(500).json({ error: "Authorization failed" });
    }
}

/**
 * Optional auth - attaches user if token present, but doesn't require it.
 * Useful for routes that work for both anonymous and authenticated users.
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split("Bearer ")[1];
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Silent fail - user just won't be attached
        next();
    }
}

module.exports = { verifyToken, requireAssistant, optionalAuth };
