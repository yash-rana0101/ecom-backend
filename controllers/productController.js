import Product from '../models/Product.js';
import axios from 'axios';

// In-memory cache for Fake Store API products
let productsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch products from Fake Store API
const fetchFromFakeStoreAPI = async () => {
  try {
    const response = await axios.get('https://fakestoreapi.com/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching from Fake Store API:', error.message);
    throw error;
  }
};

// Transform Fake Store API product to our format
const transformProduct = (fakeProduct) => ({
  _id: fakeProduct.id.toString(),
  name: fakeProduct.title,
  price: fakeProduct.price,
  description: fakeProduct.description,
  image: fakeProduct.image,
  category: fakeProduct.category,
  stock: 100, // Default stock since API doesn't provide it
  rating: fakeProduct.rating
});

export const getAllProducts = async (req, res) => {
  try {
    // Check if cache is valid
    const now = Date.now();
    if (productsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        count: productsCache.length,
        data: productsCache,
        cached: true
      });
    }

    // Fetch from Fake Store API
    const fakeStoreProducts = await fetchFromFakeStoreAPI();
    productsCache = fakeStoreProducts.map(transformProduct);
    cacheTimestamp = now;

    res.json({
      success: true,
      count: productsCache.length,
      data: productsCache,
      cached: false
    });
  } catch (error) {
    // Fallback to database if API fails
    try {
      const products = await Product.find({});
      res.json({
        success: true,
        count: products.length,
        data: products,
        fallback: true
      });
    } catch (dbError) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  }
};

export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // Try to fetch from Fake Store API
    try {
      const response = await axios.get(`https://fakestoreapi.com/products/${productId}`);
      const product = transformProduct(response.data);

      return res.json({
        success: true,
        data: product
      });
    } catch (apiError) {
      // Fallback to database
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product,
        fallback: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};
