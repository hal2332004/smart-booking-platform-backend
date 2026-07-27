// Load environment variables (supports standalone backend repo and monorepo structure)
require('dotenv').config();
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorMiddleware');

// Import routes
const locationRoutes = require('./routes/locationRoutes');
const amenityRoutes = require('./routes/amenityRoutes');
const apartmentRoutes = require('./routes/apartmentRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Configure CORS to allow requests from local frontend and production Vercel deployment
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl) or matching allowed list
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Smart Booking Platform API is running' });
});

// API Routes
app.use('/api/locations', locationRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/profiles', profileRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
