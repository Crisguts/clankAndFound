const express = require("express");
const path = require("path");
require("dotenv").config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for file uploads (in memory)
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
// We'll use upload.single('file') or similar in specific routes,
// or globally if needed, but usually it's per-route.
// For now, I'll export it or attach it to the app if needed,
// but typically it's passed to routes.
// Making it available on the app object for easy access in routes:
app.set("upload", upload);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/out'), { extensions: ['html'] }));

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve React app for all other routes (Express 5.x compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'client/out', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));
