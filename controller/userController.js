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

// Temporary storage for signup data (until OTP verification)
// In production, consider using Redis with expiry
const signupDataStorage = new Map();

// Signup - Send OTP only (DO NOT create user until OTP is verified)
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

        // Check if user already exists and is verified
        const existingUser = await User.findOne({ phone: formattedPhone });
        
        if (existingUser) {
            // If user exists and is verified, they should use login
            if (existingUser.isVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists. Please use login endpoint.'
                });
            }
            
            // If user exists but not verified, check if blocked
            if (existingUser.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'User account is blocked',
                    blockReason: existingUser.blockReason
                });
            }
        }

        // Import and send OTP via Twilio WhatsApp service
        const { sendOtp } = await import('../services/twilloService.js');
        const otpResult = await sendOtp(formattedPhone);

        if (!otpResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to send OTP',
                error: otpResult.message || 'OTP service error'
            });
        }

        // Store signup data temporarily (will be used after OTP verification)
        const signupData = {
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
            marketingOptIn: marketingOptIn || false,
            otpSentAt: new Date()
        };

        // Store signup data with expiry (10 minutes same as OTP)
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        signupDataStorage.set(formattedPhone, signupData);
        
        // Auto-delete after expiry
        setTimeout(() => {
            signupDataStorage.delete(formattedPhone);
        }, otpExpiryMinutes * 60 * 1000);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your WhatsApp. Please verify OTP to complete signup.',
            phone: formattedPhone,
            otpSent: true
            // Don't send OTP in response for security
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during signup',
            error: error.message
        });
    }
};

// Login - Verify OTP and create/authenticate user
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

        // Validate OTP format (6 digits)
        const otpString = String(otp).trim();
        if (!/^\d{6}$/.test(otpString)) {
            return res.status(400).json({
                success: false,
                message: 'OTP must be a 6-digit number'
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

        // Import and verify OTP using Twilio service
        const { verifyOtp } = await import('../services/twilloService.js');
        const verifyResult = verifyOtp(formattedPhone, otpString);

        if (!verifyResult.success) {
            return res.status(400).json({
                success: false,
                message: verifyResult.message || 'Invalid OTP'
            });
        }

        // OTP verified successfully - Now check if user exists
        let user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            // User doesn't exist - Get signup data from temporary storage
            const signupData = signupDataStorage.get(formattedPhone);

            if (!signupData) {
                // Signup data expired or not found
                signupDataStorage.delete(formattedPhone);
                return res.status(400).json({
                    success: false,
                    message: 'Signup data expired. Please signup again and verify OTP within the expiry time.'
                });
            }

            // Create user after OTP verification
            user = await User.create({
                name: signupData.name,
                email: signupData.email,
                phone: signupData.phone,
                deviceId: signupData.deviceId,
                deviceType: signupData.deviceType,
                deviceModel: signupData.deviceModel,
                deviceOs: signupData.deviceOs,
                deviceOsVersion: signupData.deviceOsVersion,
                deviceBrowser: signupData.deviceBrowser,
                deviceBrowserVersion: signupData.deviceBrowserVersion,
                deviceIp: deviceIp || signupData.deviceIp,
                deviceMacAddress: deviceMacAddress || signupData.deviceMacAddress,
                acceptedTerms: signupData.acceptedTerms,
                marketingOptIn: signupData.marketingOptIn,
                isVerified: true, // User is verified since OTP is verified
                lastLogin: new Date(),
                lastConnectionTime: new Date()
            });

            // Clear signup data from temporary storage
            signupDataStorage.delete(formattedPhone);

            res.status(201).json({
                success: true,
                message: 'Signup completed successfully. OTP verified and user created.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isVerified: user.isVerified,
                    plan: user.plan,
                    planStartTime: user.planStartTime,
                    planExpiryTime: user.planExpiryTime,
                    isSessionActive: user.isSessionActive,
                    lastLogin: user.lastLogin
                }
            });
        } else {
            // User exists - Check if blocked
            if (user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'User account is blocked',
                    blockReason: user.blockReason
                });
            }

            // Update existing user on successful verification
            user.isVerified = true;
            user.lastLogin = new Date();
            user.lastConnectionTime = new Date();
            
            // Update device info if provided
            if (deviceIp) user.deviceIp = deviceIp;
            if (deviceMacAddress) user.deviceMacAddress = deviceMacAddress;

            // Save user to database with all updates
            await user.save();

            // Populate plan info for response
            await user.populate('plan');

            res.status(200).json({
                success: true,
                message: 'Login successful. OTP verified and user authenticated.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isVerified: user.isVerified,
                    plan: user.plan,
                    planStartTime: user.planStartTime,
                    planExpiryTime: user.planExpiryTime,
                    isSessionActive: user.isSessionActive,
                    lastLogin: user.lastLogin
                }
            });
        }
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
            message: 'Error during login',
            error: error.message
        });
    }
};