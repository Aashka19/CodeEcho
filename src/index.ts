import dotenv from 'dotenv';

// Load environment variables before any other imports
dotenv.config();

import express from 'express';
import feedbackRoutes from './routes/feedback.routes';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/feedback', feedbackRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Community Insights API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 