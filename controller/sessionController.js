import mongoose from 'mongoose';
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';
import Plan from '../models/planModel.js';

// Create Session
export const createSession = async (req, res) => {
    try {
        const {
            userId,
            sessionId,
            planId,
            deviceId,
            deviceMacAddress,
            deviceIp,
            deviceType,
            deviceModel,
            deviceOs,
            deviceBrowser,
            apMacAddress,
            gatewayIp,
            freeMinutesAllowed,
            freeDataAllowed
        } = req.body;

        // Validate required fields
        if (!userId || !sessionId || !planId || !deviceMacAddress || !deviceIp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, sessionId, planId, deviceMacAddress, deviceIp are required'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if plan exists
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Check if there's already an active session with this sessionId
        const existingSession = await Session.findOne({ sessionId, isActive: true });
        if (existingSession) {
            return res.status(409).json({
                success: false,
                message: 'Active session already exists with this sessionId',
                session: existingSession
            });
        }

        // Calculate plan expiry time
        const planStartTime = new Date();
        const planExpiryTime = new Date(planStartTime.getTime() + plan.timeLimitMinutes * 60 * 1000);

        const session = await Session.create({
            user: userId,
            sessionId,
            plan: planId,
            deviceId: deviceId || user.deviceId,
            deviceMacAddress,
            deviceIp,
            deviceType: deviceType || user.deviceType,
            deviceModel: deviceModel || user.deviceModel,
            deviceOs: deviceOs || user.deviceOs,
            deviceBrowser: deviceBrowser || user.deviceBrowser,
            apMacAddress,
            gatewayIp,
            planStartTime,
            planExpiryTime,
            dataLimitMB: plan.dataLimitMB,
            timeLimitMinutes: plan.timeLimitMinutes,
            freeMinutesAllowed: freeMinutesAllowed || 0,
            freeDataAllowed: freeDataAllowed || 0,
            isActive: true,
            sessionStartTime: new Date()
        });

        // Update user's active session status
        await User.findByIdAndUpdate(userId, {
            $set: {
                isSessionActive: true,
                sessionId: sessionId,
                plan: planId,
                planStartTime,
                planExpiryTime,
                apMacAddress,
                gatewayIp,
                lastConnectionTime: new Date()
            }
        });

        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            session
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Session with this sessionId already exists',
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating session',
            error: error.message
        });
    }
};

// Get Session by ID
export const getSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('plan');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.status(200).json({
            success: true,
            session
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching session',
            error: error.message
        });
    }
};

// Get Session by SessionId
export const getSessionBySessionId = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await Session.findOne({ sessionId })
            .populate('user', 'name email phone')
            .populate('plan');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.status(200).json({
            success: true,
            session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching session',
            error: error.message
        });
    }
};

// Get Active Sessions
export const getActiveSessions = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sessions = await Session.find({ isActive: true })
            .populate('user', 'name email phone')
            .populate('plan')
            .sort({ sessionStartTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Session.countDocuments({ isActive: true });

        res.status(200).json({
            success: true,
            sessions,
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
            message: 'Error fetching active sessions',
            error: error.message
        });
    }
};

// Get Sessions by User
export const getSessionsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, isActive } = req.query;

        const query = { user: userId };
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sessions = await Session.find(query)
            .populate('plan')
            .sort({ sessionStartTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Session.countDocuments(query);

        res.status(200).json({
            success: true,
            sessions,
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
            message: 'Error fetching user sessions',
            error: error.message
        });
    }
};

// Update Session Usage
export const updateSessionUsage = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            dataUsedMB, 
            timeUsedMinutes, 
            bytesUploaded, 
            bytesDownloaded,
            packetsUploaded,
            packetsDownloaded 
        } = req.body;

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (!session.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update usage for inactive session'
            });
        }

        // Check if session is expired
        if (session.isSessionExpired()) {
            // Auto-terminate expired session
            session.isActive = false;
            session.isExpired = true;
            session.sessionEndTime = new Date();
            session.terminationReason = 'expired';
            session.terminatedBy = 'system';

            await session.save();

            // Update user status
            await User.findByIdAndUpdate(session.user, {
                $set: { isSessionActive: false }
            });

            return res.status(400).json({
                success: false,
                message: 'Session has expired',
                session
            });
        }

        const updateData = {
            lastActivityTime: new Date(),
            lastDataUpdateTime: new Date()
        };

        if (dataUsedMB !== undefined) {
            updateData.dataUsedMB = dataUsedMB;
            // Check if data limit exceeded
            if (session.dataLimitMB && dataUsedMB >= session.dataLimitMB) {
                updateData.isActive = false;
                updateData.isExpired = true;
                updateData.sessionEndTime = new Date();
                updateData.terminationReason = 'data_exceeded';
                updateData.terminatedBy = 'system';
            }
        }

        if (timeUsedMinutes !== undefined) {
            updateData.timeUsedMinutes = timeUsedMinutes;
            // Check if time limit exceeded
            if (session.timeLimitMinutes && timeUsedMinutes >= session.timeLimitMinutes) {
                updateData.isActive = false;
                updateData.isExpired = true;
                updateData.sessionEndTime = new Date();
                updateData.terminationReason = 'time_exceeded';
                updateData.terminatedBy = 'system';
            }
        }

        if (bytesUploaded !== undefined) updateData.bytesUploaded = bytesUploaded;
        if (bytesDownloaded !== undefined) updateData.bytesDownloaded = bytesDownloaded;
        if (packetsUploaded !== undefined) updateData.packetsUploaded = packetsUploaded;
        if (packetsDownloaded !== undefined) updateData.packetsDownloaded = packetsDownloaded;

        const updatedSession = await Session.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).populate('plan');

        // If session was terminated, update user status
        if (updatedSession && !updatedSession.isActive) {
            await User.findByIdAndUpdate(session.user, {
                $set: { isSessionActive: false }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Session usage updated successfully',
            session: updatedSession
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating session usage',
            error: error.message
        });
    }
};

// Terminate Session
export const terminateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { terminationReason, terminatedBy = 'admin' } = req.body;

        const session = await Session.findById(id);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (!session.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Session is already terminated'
            });
        }

        session.isActive = false;
        session.sessionEndTime = new Date();
        session.terminationReason = terminationReason || 'manual';
        session.terminatedBy = terminatedBy;

        await session.save();

        // Update user status
        await User.findByIdAndUpdate(session.user, {
            $set: { isSessionActive: false }
        });

        res.status(200).json({
            success: true,
            message: 'Session terminated successfully',
            session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error terminating session',
            error: error.message
        });
    }
};

// Get Session Statistics
export const getSessionStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await Session.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    activeSessions: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    totalDataUsedMB: { $sum: '$dataUsedMB' },
                    totalTimeUsedMinutes: { $sum: '$timeUsedMinutes' },
                    totalBytesUploaded: { $sum: '$bytesUploaded' },
                    totalBytesDownloaded: { $sum: '$bytesDownloaded' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: stats[0] || {
                totalSessions: 0,
                activeSessions: 0,
                totalDataUsedMB: 0,
                totalTimeUsedMinutes: 0,
                totalBytesUploaded: 0,
                totalBytesDownloaded: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching session statistics',
            error: error.message
        });
    }
};

// Cleanup Expired Sessions (for cron job)
export const cleanupExpiredSessions = async (req, res) => {
    try {
        const now = new Date();

        // Find expired active sessions
        const expiredSessions = await Session.find({
            isActive: true,
            $or: [
                { planExpiryTime: { $lt: now } },
                { $expr: { $gte: ['$dataUsedMB', '$dataLimitMB'] } },
                { $expr: { $gte: ['$timeUsedMinutes', '$timeLimitMinutes'] } }
            ]
        });

        const sessionIds = expiredSessions.map(s => s._id);
        const userIds = [...new Set(expiredSessions.map(s => s.user.toString()))];

        // Update expired sessions
        await Session.updateMany(
            { _id: { $in: sessionIds } },
            {
                $set: {
                    isActive: false,
                    isExpired: true,
                    sessionEndTime: now,
                    terminationReason: 'expired',
                    terminatedBy: 'system'
                }
            }
        );

        // Update user statuses
        await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { isSessionActive: false } }
        );

        res.status(200).json({
            success: true,
            message: `Cleaned up ${expiredSessions.length} expired sessions`,
            count: expiredSessions.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cleaning up expired sessions',
            error: error.message
        });
    }
};

