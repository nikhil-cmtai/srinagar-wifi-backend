import User from '../models/userModel.js';

// Create User
export const createUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            phone, 
            deviceId, 
            deviceType, 
            deviceModel, 
            deviceOs, 
            deviceOsVersion, 
            deviceBrowser, 
            deviceBrowserVersion, 
            deviceIp, 
            deviceMacAddress,
            acceptedTerms,
            marketingOptIn
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !deviceId || !deviceMacAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, phone, deviceId, deviceMacAddress are required'
            });
        }

        // Check if user already exists by phone or email
        const existingUser = await User.findOne({
            $or: [{ phone }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this phone number or email',
                user: existingUser
            });
        }

        const user = await User.create({
            name,
            email,
            phone,
            deviceId,
            deviceType,
            deviceModel,
            deviceOs,
            deviceOsVersion,
            deviceBrowser,
            deviceBrowserVersion,
            deviceIp,
            deviceMacAddress,
            acceptedTerms: acceptedTerms || false,
            marketingOptIn: marketingOptIn || false
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user
        });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field} already exists`,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// Get User by ID
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('plan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Get User by Phone
export const getUserByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        const user = await User.findOne({ phone }).populate('plan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this phone number'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Get User by MAC Address
export const getUserByMacAddress = async (req, res) => {
    try {
        const { macAddress } = req.params;
        const user = await User.findOne({ deviceMacAddress: macAddress }).populate('plan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this MAC address'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, isVerified, isBlocked, isSessionActive } = req.query;
        
        const query = {};
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';
        if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
        if (isSessionActive !== undefined) query.isSessionActive = isSessionActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const users = await User.find(query)
            .populate('plan')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Update User
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('plan');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate value error',
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// Update User Verification Status
export const updateUserVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { 
                $set: { isVerified, lastLogin: new Date() },
                $unset: { lastOtp: "", otpRequestedAt: "" }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user verification',
            error: error.message
        });
    }
};

// Block/Unblock User
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked, blockReason } = req.body;

        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isBlocked must be a boolean value'
            });
        }

        const updateData = { isBlocked };
        if (isBlocked && blockReason) {
            updateData.blockReason = blockReason;
        } else if (!isBlocked) {
            updateData.blockReason = null;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error blocking/unblocking user',
            error: error.message
        });
    }
};

// Delete User
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            user
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Update User OTP Info
export const updateUserOtp = async (req, res) => {
    try {
        const { id } = req.params;
        const { lastOtp, otpAttempts } = req.body;

        const updateData = {};
        if (lastOtp) {
            updateData.lastOtp = lastOtp;
            updateData.otpRequestedAt = new Date();
        }
        if (otpAttempts !== undefined) {
            updateData.otpAttempts = otpAttempts;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP information updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating OTP information',
            error: error.message
        });
    }
};

// Signup - Create user with device info and send OTP
export const signup = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            deviceId,
            deviceType,
            deviceModel,
            deviceOs,
            deviceOsVersion,
            deviceBrowser,
            deviceBrowserVersion,
            deviceIp,
            deviceMacAddress,
            acceptedTerms,
            marketingOptIn
        } = req.body;

        // Validate required fields
        if (!phone || !deviceMacAddress || !deviceIp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: phone, deviceMacAddress, deviceIp are required'
            });
        }

        // Format phone number (ensure +91 prefix for Indian numbers)
        let formattedPhone = String(phone).trim().replace(/\s/g, '');
        if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.length === 10) {
                formattedPhone = `+91${formattedPhone}`;
            } else {
                formattedPhone = `+${formattedPhone}`;
            }
        }

        // Check if user already exists
        let user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                name: name || 'User',
                email: email || `${formattedPhone}@example.com`,
                phone: formattedPhone,
                deviceId: deviceId || deviceMacAddress,
                deviceType: deviceType || 'unknown',
                deviceModel: deviceModel || 'unknown',
                deviceOs: deviceOs || 'unknown',
                deviceOsVersion: deviceOsVersion || 'unknown',
                deviceBrowser: deviceBrowser || 'unknown',
                deviceBrowserVersion: deviceBrowserVersion || 'unknown',
                deviceIp,
                deviceMacAddress,
                acceptedTerms: acceptedTerms || false,
                marketingOptIn: marketingOptIn || false
            });
        } else {
            // Update device info if user exists
            user.deviceId = deviceId || user.deviceId;
            user.deviceIp = deviceIp;
            user.deviceMacAddress = deviceMacAddress;
            user.deviceType = deviceType || user.deviceType;
            user.deviceModel = deviceModel || user.deviceModel;
            user.deviceOs = deviceOs || user.deviceOs;
            user.deviceBrowser = deviceBrowser || user.deviceBrowser;
            if (name) user.name = name;
            if (email) user.email = email;
            await user.save();
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'User account is blocked',
                blockReason: user.blockReason
            });
        }

        // Send OTP
        const { sendOtp } = await import('../services/twilloService.js');
        const otpResult = await sendOtp(formattedPhone);

        if (!otpResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to send OTP',
                error: otpResult.message
            });
        }

        // Update user OTP info
        user.lastOtp = otpResult.otp; // Remove this in production
        user.otpRequestedAt = new Date();
        user.otpAttempts = 0;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your WhatsApp',
            userId: user._id,
            phone: formattedPhone,
            otpSent: true
            // Don't send OTP in response for security
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field} already exists`,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error during signup',
            error: error.message
        });
    }
};

// Login - Verify OTP and authenticate user
export const login = async (req, res) => {
    try {
        const { phone, otp, deviceIp, deviceMacAddress } = req.body;

        // Validate required fields
        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        // Format phone number
        let formattedPhone = String(phone).trim().replace(/\s/g, '');
        if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.length === 10) {
                formattedPhone = `+91${formattedPhone}`;
            } else {
                formattedPhone = `+${formattedPhone}`;
            }
        }

        // Find user
        const user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please signup first.'
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'User account is blocked',
                blockReason: user.blockReason
            });
        }

        // Verify OTP
        const { verifyOtp } = await import('../services/twilloService.js');
        const verifyResult = await Promise.resolve(verifyOtp(formattedPhone, otp));

        if (!verifyResult.success) {
            // Increment OTP attempts
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: verifyResult.message || 'Invalid OTP',
                attemptsRemaining: Math.max(0, 3 - user.otpAttempts)
            });
        }

        // Update user on successful verification
        user.isVerified = true;
        user.otpAttempts = 0;
        user.lastLogin = new Date();
        user.lastConnectionTime = new Date();
        
        // Update device info if provided
        if (deviceIp) user.deviceIp = deviceIp;
        if (deviceMacAddress) user.deviceMacAddress = deviceMacAddress;

        // Clear OTP data
        user.lastOtp = null;
        user.otpRequestedAt = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isVerified: user.isVerified,
                plan: user.plan,
                planStartTime: user.planStartTime,
                planExpiryTime: user.planExpiryTime,
                isSessionActive: user.isSessionActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};