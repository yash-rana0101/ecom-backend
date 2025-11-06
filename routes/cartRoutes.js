import express from 'express';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;
