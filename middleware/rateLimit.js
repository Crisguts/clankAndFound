const rateLimit = require("express-rate-limit");

// Simple in-memory rate limiter
// In production, use Redis or Memcached
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many inquiries from this IP, please try again after an hour",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = limiter;
