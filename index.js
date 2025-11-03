import dotenv from 'dotenv';
// Load environment variables FIRST before importing other modules
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routers/authRoute.js';
import userRoutes from './routers/userRoute.js';
import planRoutes from './routers/planRoute.js';
import sessionRoutes from './routers/sessionRoute.js';
import orderRoutes from './routers/orderRoute.js';
import connectDB from './config/db.js';

connectDB();

const app = express();

const PORT= process.env.PORT || 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
