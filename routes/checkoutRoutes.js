import express from 'express';
import * as checkoutController from '../controllers/checkoutController.js';

const router = express.Router();

router.post('/', checkoutController.checkout);
router.get('/orders', checkoutController.getOrderHistory);

export default router;
