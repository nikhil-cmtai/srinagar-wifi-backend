import express from 'express';
import {
    createUser,
    getUser,
    getUserByPhone,
    getUserByMacAddress,
    getAllUsers,
    updateUser,
    updateUserVerification,
    blockUser,
    deleteUser,
    updateUserOtp
} from '../controller/userController.js';

const router = express.Router();

// Create User
router.post('/', createUser);

// Get All Users (with filters)
router.get('/', getAllUsers);

// Get User by ID
router.get('/:id', getUser);

// Get User by Phone
router.get('/phone/:phone', getUserByPhone);

// Get User by MAC Address
router.get('/mac/:macAddress', getUserByMacAddress);

// Update User
router.put('/:id', updateUser);

// Update User Verification
router.patch('/:id/verification', updateUserVerification);

// Block/Unblock User
router.patch('/:id/block', blockUser);

// Update User OTP Info
router.patch('/:id/otp', updateUserOtp);

// Delete User
router.delete('/:id', deleteUser);

export default router;

