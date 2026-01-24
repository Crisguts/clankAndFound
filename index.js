const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve React app for all other routes (Express 5.x compatible)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
