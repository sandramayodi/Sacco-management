const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const config = require('./config/config');
const errorHandler = require('./middleware/error');


// Import routes
const memberRoutes = require('./routes/memberRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const loanRoutes = require('./routes/loanRoutes');
const financialRoutes = require('./routes/financialRoutes');
const agricultureRoutes = require('./routes/agricultureRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors( {
    origin:'http:/localhost:5000',

  }));

// Logging in development mode
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount routes
app.use('/api/members', memberRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/agriculture', agricultureRoutes);
app.use('/api/notifications', notificationRoutes);

// For any other route, serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/pages/index.html'));
});

// Error handling middleware
app.use(errorHandler);
// server.js or app.js
// This should be after all your routes

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

module.exports = app;