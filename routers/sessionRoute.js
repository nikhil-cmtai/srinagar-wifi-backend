import express from 'express';
import {
    createSession,
    getSession,
    getSessionBySessionId,
    getActiveSessions,
    getSessionsByUser,
    updateSessionUsage,
    terminateSession,
    getSessionStats,
    cleanupExpiredSessions
} from '../controller/sessionController.js';

const router = express.Router();

// Create Session
router.post('/', createSession);

// Get All Active Sessions
router.get('/active', getActiveSessions);

// Cleanup Expired Sessions (for cron jobs)
router.post('/cleanup', cleanupExpiredSessions);

// Get Session Statistics by User
router.get('/stats/:userId', getSessionStats);

// Get Sessions by User
router.get('/user/:userId', getSessionsByUser);

// Get Session by SessionId
router.get('/session/:sessionId', getSessionBySessionId);

// Get Session by ID
router.get('/:id', getSession);

// Update Session Usage
router.patch('/:id/usage', updateSessionUsage);

// Terminate Session
router.patch('/:id/terminate', terminateSession);

export default router;

