import Plan from '../models/planModel.js';

// Create Plan
export const createPlan = async (req, res) => {
    try {
        const { name, dataLimitMB, timeLimitMinutes, price, isActive } = req.body;

        // Validate required fields
        if (!name || dataLimitMB === undefined || timeLimitMinutes === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, dataLimitMB, and timeLimitMinutes are required'
            });
        }

        // Validate numeric values
        if (typeof dataLimitMB !== 'number' || dataLimitMB < 0) {
            return res.status(400).json({
                success: false,
                message: 'dataLimitMB must be a non-negative number'
            });
        }

        if (typeof timeLimitMinutes !== 'number' || timeLimitMinutes < 0) {
            return res.status(400).json({
                success: false,
                message: 'timeLimitMinutes must be a non-negative number'
            });
        }

        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({
                success: false,
                message: 'price must be a non-negative number'
            });
        }

        const plan = await Plan.create({
            name,
            dataLimitMB,
            timeLimitMinutes,
            price: price || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            plan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating plan',
            error: error.message
        });
    }
};

// Get Plan by ID
export const getPlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            plan
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching plan',
            error: error.message
        });
    }
};

// Get All Plans
export const getAllPlans = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive, minPrice, maxPrice } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const plans = await Plan.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Plan.countDocuments(query);

        res.status(200).json({
            success: true,
            plans,
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
            message: 'Error fetching plans',
            error: error.message
        });
    }
};

// Get Active Plans Only
export const getActivePlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });

        res.status(200).json({
            success: true,
            plans,
            count: plans.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching active plans',
            error: error.message
        });
    }
};

// Update Plan
export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        // Validate numeric values if provided
        if (updateData.dataLimitMB !== undefined && (typeof updateData.dataLimitMB !== 'number' || updateData.dataLimitMB < 0)) {
            return res.status(400).json({
                success: false,
                message: 'dataLimitMB must be a non-negative number'
            });
        }

        if (updateData.timeLimitMinutes !== undefined && (typeof updateData.timeLimitMinutes !== 'number' || updateData.timeLimitMinutes < 0)) {
            return res.status(400).json({
                success: false,
                message: 'timeLimitMinutes must be a non-negative number'
            });
        }

        if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price < 0)) {
            return res.status(400).json({
                success: false,
                message: 'price must be a non-negative number'
            });
        }

        const plan = await Plan.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Plan updated successfully',
            plan
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating plan',
            error: error.message
        });
    }
};

// Activate/Deactivate Plan
export const togglePlanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive must be a boolean value'
            });
        }

        const plan = await Plan.findByIdAndUpdate(
            id,
            { $set: { isActive } },
            { new: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Plan ${isActive ? 'activated' : 'deactivated'} successfully`,
            plan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating plan status',
            error: error.message
        });
    }
};

// Delete Plan
export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await Plan.findByIdAndDelete(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Plan deleted successfully',
            plan
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting plan',
            error: error.message
        });
    }
};

