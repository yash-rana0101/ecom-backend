import Product from '../models/Product.js';
import axios from 'axios';

// In-memory cache for Fake Store API products
let productsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Configure axios instance with proper headers
const api = axios.create({
  baseURL: 'https://fakestoreapi.com',
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9'
  }
});

// Fetch products from Fake Store API with retry logic
const fetchFromFakeStoreAPI = async () => {
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      lastError = error;
      retries--;
      console.error(`Error fetching from Fake Store API (${retries} retries left):`, error.message);

      if (retries > 0) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }
  }

  throw lastError;
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
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
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
    console.error('Failed to fetch from Fake Store API:', error.message);

    // If we have stale cache, return it
    if (productsCache) {
      return res.json({
        success: true,
        count: productsCache.length,
        data: productsCache,
        cached: true,
        stale: true,
        message: 'Returning cached data due to API error'
      });
    }

    // Fallback to database if API fails and no cache
    try {
      const products = await Product.find({});

      if (products.length > 0) {
        return res.json({
          success: true,
          count: products.length,
          data: products,
          fallback: true,
          message: 'Returning data from database'
        });
      }

      // If database is also empty, return empty array
      res.json({
        success: true,
        count: 0,
        data: [],
        message: 'No products available'
      });
    } catch (dbError) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products from all sources',
        error: error.message
      });
    }
  }
};

export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // Check cache first
    if (productsCache) {
      const cachedProduct = productsCache.find(p => p._id === productId);
      if (cachedProduct) {
        return res.json({
          success: true,
          data: cachedProduct,
          cached: true
        });
      }
    }

    // Try to fetch from Fake Store API with retry
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        const response = await api.get(`/products/${productId}`);
        const product = transformProduct(response.data);

        return res.json({
          success: true,
          data: product
        });
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    }

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};
