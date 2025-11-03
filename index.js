import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routers/authRoute.js';
import connectDB from './config/db.js';


connectDB();
dotenv.config();

const app = express();

const PORT= process.env.PORT || 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
