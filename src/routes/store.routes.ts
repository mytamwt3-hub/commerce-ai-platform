import express, { Router } from 'express';
import { pool } from '../config/database';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Create Product
router.post('/products', verifyToken, async (req: any, res) => {
  try {
    const { name, description, price, originalPrice, stock, barcode, category, images, sizes, colors } = req.body;

    const product = await pool.query(
      `INSERT INTO products (merchant_id, name, description, price, original_price, stock, barcode, category, images, sizes, colors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [req.user.id, name, description, price, originalPrice, stock, barcode, category, JSON.stringify(images), JSON.stringify(sizes || []), JSON.stringify(colors || [])]
    );

    res.status(201).json(product.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get All Products (For Customer)
router.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = $' + (params.length + 1);
      params.push(category);
    }

    if (search) {
      query += ' AND (name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }

    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, (parseInt(page as string) - 1) * parseInt(limit as string));

    const products = await pool.query(query, params);
    res.json(products.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Merchant Products
router.get('/merchant/products', verifyToken, async (req: any, res) => {
  try {
    const products = await pool.query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(products.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Update Product
router.put('/products/:productId', verifyToken, async (req: any, res) => {
  try {
    const { name, description, price, originalPrice, stock, category, images } = req.body;
    const product = await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, original_price = $4, stock = $5, category = $6, images = $7 
       WHERE id = $8 AND merchant_id = $9 RETURNING *`,
      [name, description, price, originalPrice, stock, category, JSON.stringify(images), req.params.productId, req.user.id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Delete Product
router.delete('/products/:productId', verifyToken, async (req: any, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 AND merchant_id = $2', [req.params.productId, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Product Details
router.get('/products/:productId', async (req, res) => {
  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.productId]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Add Product Review
router.post('/products/:productId/reviews', verifyToken, async (req: any, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await pool.query(
      `INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.productId, req.user.id, rating, comment]
    );
    res.status(201).json(review.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Product Reviews
router.get('/products/:productId/reviews', async (req, res) => {
  try {
    const reviews = await pool.query('SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC', [req.params.productId]);
    res.json(reviews.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Create Order
router.post('/orders', verifyToken, async (req: any, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.price * item.quantity;
    }

    const tax = totalAmount * 0.15; // 15% tax
    const shippingCost = 50; // Fixed shipping cost
    const finalAmount = totalAmount + tax + shippingCost;

    const order = await pool.query(
      `INSERT INTO orders (customer_id, items, total_amount, tax, shipping_cost, final_amount, shipping_address, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, JSON.stringify(items), totalAmount, tax, shippingCost, finalAmount, shippingAddress, paymentMethod]
    );

    res.status(201).json(order.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Customer Orders
router.get('/orders', verifyToken, async (req: any, res) => {
  try {
    const orders = await pool.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(orders.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Order Details
router.get('/orders/:orderId', verifyToken, async (req: any, res) => {
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1 AND customer_id = $2', [req.params.orderId, req.user.id]);
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Update Order Status (For Merchant)
router.put('/orders/:orderId/status', verifyToken, async (req: any, res) => {
  try {
    const { status } = req.body;
    const order = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.orderId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Merchant Orders
router.get('/merchant/orders', verifyToken, async (req: any, res) => {
  try {
    const orders = await pool.query('SELECT * FROM orders WHERE merchant_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(orders.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Add to Cart
router.post('/cart/items', verifyToken, async (req: any, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const cartItem = await pool.query(
      `INSERT INTO cart_items (customer_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, productId, quantity, product.rows[0].price]
    );

    res.status(201).json(cartItem.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Cart Items
router.get('/cart/items', verifyToken, async (req: any, res) => {
  try {
    const cartItems = await pool.query('SELECT * FROM cart_items WHERE customer_id = $1', [req.user.id]);
    res.json(cartItems.rows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Remove from Cart
router.delete('/cart/items/:cartItemId', verifyToken, async (req: any, res) => {
  try {
    const result = await pool.query('DELETE FROM cart_items WHERE id = $1 AND customer_id = $2', [req.params.cartItemId, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

// Get Store Analytics
router.get('/analytics', verifyToken, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;

    const totalSales = await pool.query(
      `SELECT COUNT(*) as count, SUM(final_amount) as total FROM orders WHERE merchant_id = $1 AND created_at BETWEEN $2 AND $3`,
      [req.user.id, startDate, endDate]
    );

    const topProducts = await pool.query(
      `SELECT product_id, COUNT(*) as sales_count FROM order_items GROUP BY product_id LIMIT 10`
    );

    res.json({
      totalSales: totalSales.rows[0],
      topProducts: topProducts.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
});

export default router;
