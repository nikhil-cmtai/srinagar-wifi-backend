import express from 'express';
import {
    createOrder,
    getOrder,
    getAllOrders,
    getOrdersByUser,
    updateOrderStatus,
    completeOrder,
    cancelOrder,
    getOrderStats,
    deleteOrder
} from '../controller/orderController.js';

const router = express.Router();

// Create Order
router.post('/', createOrder);

// Get All Orders (with filters)
router.get('/', getAllOrders);

// Get Order Statistics (optional userId)
router.get('/stats', getOrderStats);
router.get('/stats/:userId', getOrderStats);

// Get Orders by User
router.get('/user/:userId', getOrdersByUser);

// Get Order by ID
router.get('/:id', getOrder);

// Update Order Status
router.patch('/:id/status', updateOrderStatus);

// Complete Order
router.patch('/:id/complete', completeOrder);

// Cancel Order
router.patch('/:id/cancel', cancelOrder);

// Delete Order
router.delete('/:id', deleteOrder);

export default router;

