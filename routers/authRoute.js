import express from 'express';
import { sendOtp, verifyOtp } from '../services/twilloService.js';
import { signup, login } from '../controller/userController.js';

const router = express.Router();

// Signup - Create user and send OTP
router.post('/signup', signup);

// Login - Verify OTP and authenticate
router.post('/login', login);

// Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required'
            });
        }
        const result = await sendOtp(mobileNumber);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            error: error.message
        });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;
        if (!mobileNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and OTP are required'
            });
        }
        const result = verifyOtp(mobileNumber, otp);
        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
});

export default router;