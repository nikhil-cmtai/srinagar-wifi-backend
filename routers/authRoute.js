import express from 'express';
import { sendOtp, verifyOtp } from '../services/twilloService.js';

const router = express.Router();

router.post('/send-otp', async (req, res) => {
    const { mobileNumber } = req.body;
    const result = await sendOtp(mobileNumber);
    res.json(result);
});

router.post('/verify-otp', async (req, res) => {
    const { mobileNumber, otp } = req.body;
    const result = await verifyOtp(mobileNumber, otp);
    res.json(result);
});

export default router;