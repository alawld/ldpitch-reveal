const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // reveal.js needs unsafe-eval
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://clientsdk.launchdarkly.com", "https://events.launchdarkly.com", "https://app.launchdarkly.com", "https://clientstream.launchdarkly.com"]
    }
  }
}));

// Enable CORS
app.use(cors());

// Enable compression
app.use(compression());

// Serve static files
app.use(express.static('public'));
app.use('/reveal.js', express.static(path.join(__dirname, 'node_modules/reveal.js')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API endpoint for LaunchDarkly configuration
app.get('/api/config', (req, res) => {
  res.json({
    clientSideId: process.env.LAUNCHDARKLY_CLIENT_SIDE_ID || '',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API endpoint for LaunchDarkly flag status (placeholder - will be handled client-side)
app.get('/api/flags', (req, res) => {
  // This endpoint can be used for server-side flag evaluation if needed
  res.json({
    'guarded-releases-section': false,
    'experimentation-section': false,
    'ai-configs-section': false,
    'observability-section': false
  });
});

// Serve the main presentation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LaunchDarkly Presentation Server running on port ${PORT}`);
  console.log(`📊 Access the presentation at http://localhost:${PORT}`);
  console.log(`❤️  Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
