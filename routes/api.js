const express = require('express');
const router = express.Router();

// Example API route
router.get('/hello', (req, res) => {
    res.json({ message: 'Hello from the API!' });
});

// Example POST route
router.post('/data', (req, res) => {
    const { data } = req.body;
    res.json({ received: data, timestamp: new Date() });
});

module.exports = router;
