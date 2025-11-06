import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};

export const checkout = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      cartItems
    } = req.body;

    if (!customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and email are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const orderItems = cartItems.map(item => ({
      productId: (item.productId._id || item.productId).toString(),
      productName: item.productId.name || 'Unknown Product',
      quantity: item.quantity,
      price: item.price
    }));

    const totalAmount = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      userId: req.headers['user-id'] || 'guest-user',
      customerName,
      customerEmail,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      items: orderItems,
      totalAmount,
      orderNumber,
      status: 'completed'
    });

    const userId = req.headers['user-id'] || 'guest-user';
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalAmount: 0 }
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        phone: order.phone,
        address: order.address,
        city: order.city,
        state: order.state,
        zipCode: order.zipCode,
        country: order.country,
        items: order.items,
        totalAmount: order.totalAmount,
        timestamp: order.createdAt,
        status: order.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: error.message
    });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'guest-user';
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error.message
    });
  }
};
