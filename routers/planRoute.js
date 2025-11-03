import express from 'express';
import {
    createPlan,
    getPlan,
    getAllPlans,
    getActivePlans,
    updatePlan,
    togglePlanStatus,
    deletePlan
} from '../controller/planController.js';

const router = express.Router();

// Create Plan
router.post('/', createPlan);

// Get All Plans (with filters)
router.get('/', getAllPlans);

// Get Active Plans Only
router.get('/active', getActivePlans);

// Get Plan by ID
router.get('/:id', getPlan);

// Update Plan
router.put('/:id', updatePlan);

// Toggle Plan Status (Activate/Deactivate)
router.patch('/:id/status', togglePlanStatus);

// Delete Plan
router.delete('/:id', deletePlan);

export default router;

