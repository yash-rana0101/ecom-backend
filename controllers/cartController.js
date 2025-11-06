import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import axios from 'axios';
import mongoose from 'mongoose';

const getUserId = (req) => {
  return req.headers['user-id'] || 'guest-user';
};

// Fetch product from Fake Store API or database
const getProduct = async (productId) => {
  // Check if it's a valid MongoDB ObjectId
  const isValidObjectId = mongoose.Types.ObjectId.isValid(productId) &&
    productId.length === 24;

  if (!isValidObjectId) {
    // It's likely a Fake Store API product ID (numeric string)
    try {
      const response = await axios.get(`https://fakestoreapi.com/products/${productId}`);
      return {
        _id: response.data.id.toString(),
        name: response.data.title,
        price: response.data.price,
        description: response.data.description,
        image: response.data.image,
        category: response.data.category,
        stock: 100, // Default stock
        rating: response.data.rating
      };
    } catch (error) {
      return null;
    }
  }

  // Try to find in database
  return await Product.findById(productId);
};

export const getCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    cart.calculateTotal();
    await cart.save();

    // Populate cart items manually since they might not be in database
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await getProduct(item.productId);
        return {
          ...item.toObject(),
          productId: prod || { _id: item.productId, name: 'Product not found', price: 0 }
        };
      })
    );

    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };

    res.json({
      success: true,
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Use the helper function to get product from API or database
    const product = await getProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    const userId = getUserId(req);
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: productId.toString(),
        quantity,
        price: product.price
      });
    }

    cart.calculateTotal();
    await cart.save();

    // Populate cart items manually since they might not be in database
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await getProduct(item.productId);
        return {
          ...item.toObject(),
          productId: prod
        };
      })
    );

    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const userId = getUserId(req);
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const product = await getProduct(cart.items[itemIndex].productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.calculateTotal();
    await cart.save();

    // Populate cart items manually
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await getProduct(item.productId);
        return {
          ...item.toObject(),
          productId: prod
        };
      })
    );

    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };

    res.json({
      success: true,
      message: 'Cart updated',
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update cart',
      error: error.message
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== id);
    cart.calculateTotal();
    await cart.save();

    // Populate cart items manually
    const populatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const prod = await getProduct(item.productId);
        return {
          ...item.toObject(),
          productId: prod
        };
      })
    );

    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: populatedCart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = getUserId(req);
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};
