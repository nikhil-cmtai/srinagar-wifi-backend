import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Plan from '../models/planModel.js';

// Create Order
export const createOrder = async (req, res) => {
    try {
        const { userId, planId, amount, paymentMethod, status = 'pending' } = req.body;

        // Validate required fields
        if (!userId || !planId || amount === undefined || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, planId, amount, paymentMethod are required'
            });
        }

        // Validate amount
        if (typeof amount !== 'number' || amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'amount must be a non-negative number'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${validStatuses.join(', ')}`
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

        // Verify amount matches plan price (if not free)
        if (plan.price > 0 && amount !== plan.price) {
            return res.status(400).json({
                success: false,
                message: `Amount mismatch. Plan price is ${plan.price}, but provided amount is ${amount}`
            });
        }

        const order = await Order.create({
            user: userId,
            plan: planId,
            amount,
            status,
            paymentMethod
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: await Order.findById(order._id).populate('user', 'name email phone').populate('plan')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Get Order by ID
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('plan');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Get All Orders
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, userId, planId } = req.query;

        const query = {};
        if (status) query.status = status;
        if (userId) query.user = userId;
        if (planId) query.plan = planId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .populate('user', 'name email phone')
            .populate('plan')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            orders,
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
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get Orders by User
export const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        const query = { user: userId };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .populate('plan')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
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
            message: 'Error fetching user orders',
            error: error.message
        });
    }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        ).populate('user', 'name email phone').populate('plan');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

// Complete Order (and assign plan to user)
export const completeOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id).populate('plan');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Order is already completed'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot complete a cancelled order'
            });
        }

        // Update order status
        order.status = 'completed';
        await order.save();

        // Assign plan to user
        const planStartTime = new Date();
        const planExpiryTime = new Date(planStartTime.getTime() + order.plan.timeLimitMinutes * 60 * 1000);

        await User.findByIdAndUpdate(order.user, {
            $set: {
                plan: order.plan._id,
                planStartTime,
                planExpiryTime
            }
        });

        res.status(200).json({
            success: true,
            message: 'Order completed and plan assigned to user',
            order: await Order.findById(order._id).populate('user', 'name email phone').populate('plan')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error completing order',
            error: error.message
        });
    }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed order. Please process a refund if needed.'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled'
            });
        }

        order.status = 'cancelled';
        if (reason) {
            order.cancellationReason = reason;
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order: await Order.findById(order._id).populate('user', 'name email phone').populate('plan')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
};

// Get Order Statistics
export const getOrderStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const query = userId ? { user: userId } : {};

        const stats = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalStats = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$amount' },
                    completedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    failedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: stats,
            totals: totalStats[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                completedOrders: 0,
                pendingOrders: 0,
                failedOrders: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order statistics',
            error: error.message
        });
    }
};

// Delete Order
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully',
            order
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting order',
            error: error.message
        });
    }
};

