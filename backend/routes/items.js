import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/listings/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    let result = await pool.query(`
      SELECT id, name, slug, icon_name, parent_category_id, sort_order
      FROM categories
      WHERE is_active = true
      ORDER BY sort_order, name
    `);
    if (result.rows.length === 0) {
      await pool.query(`
        INSERT INTO categories (name, slug, sort_order) VALUES
          ('Books & Study Materials', 'books-study-materials', 1),
          ('Electronics', 'electronics', 2),
          ('Furniture', 'furniture', 3),
          ('Clothing & Accessories', 'clothing-accessories', 4),
          ('Sports & Recreation', 'sports-recreation', 5),
          ('Appliances', 'appliances', 6),
          ('Vehicles', 'vehicles', 7),
          ('Other', 'other', 8)
        ON CONFLICT (slug) DO NOTHING
      `);
      result = await pool.query(`
        SELECT id, name, slug, icon_name, parent_category_id, sort_order
        FROM categories
        WHERE is_active = true
        ORDER BY sort_order, name
      `);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a new item listing
router.post('/', authenticateToken, upload.array('photos', 10), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      title,
      description,
      price,
      condition,
      category_id,
      location_text,
      pickup_only,
      willing_to_ship,
      negotiable,
      firm,
      payment_methods,
      open_to_trades,
      trade_description,
      trade_preference,
      meetup_locations,
      availability,
      special_instructions,
      status = 'draft'
    } = req.body;

    const seller_id = req.user.id;

    // Validate required fields
    if (!title || !description || !price || !condition || !category_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate photos (minimum 3 for available, 0 for draft)
    const minPhotos = status === 'available' ? 3 : 0;
    if (!req.files || req.files.length < minPhotos) {
      return res.status(400).json({ error: `At least ${minPhotos} photos are required for ${status} listings` });
    }

    // Process photos
    const photos = req.files ? req.files.map(file => ({
      url: `/uploads/listings/${file.filename}`,
      filename: file.filename
    })) : [];

    const primary_photo_url = photos.length > 0 ? photos[0].url : null;

    // Parse JSON fields
    let parsedPaymentMethods = [];
    let parsedMeetupLocations = [];
    let parsedAvailability = [];

    try {
      if (payment_methods) {
        parsedPaymentMethods = typeof payment_methods === 'string' 
          ? JSON.parse(payment_methods) 
          : payment_methods;
      }
      if (meetup_locations) {
        parsedMeetupLocations = typeof meetup_locations === 'string' 
          ? JSON.parse(meetup_locations) 
          : meetup_locations;
      }
      if (availability) {
        parsedAvailability = typeof availability === 'string' 
          ? JSON.parse(availability) 
          : availability;
      }
    } catch (e) {
      console.error('Error parsing JSON fields:', e);
    }

    // Insert item
    const itemResult = await client.query(`
      INSERT INTO items (
        seller_id, category_id, title, description, price, condition,
        status, location_text, pickup_only, willing_to_ship,
        photos, primary_photo_url, negotiable, firm, payment_methods,
        open_to_trades, trade_description, trade_preference,
        meetup_locations, availability, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      seller_id, 
      category_id, 
      title, 
      description, 
      parseFloat(price), 
      condition,
      status, 
      location_text || '', 
      pickup_only === 'true' || pickup_only === true, 
      willing_to_ship === 'true' || willing_to_ship === true,
      JSON.stringify(photos), 
      primary_photo_url, 
      negotiable === 'true' || negotiable === true,
      firm === 'true' || firm === true,
      JSON.stringify(parsedPaymentMethods),
      open_to_trades === 'true' || open_to_trades === true,
      trade_description || null,
      trade_preference || null,
      JSON.stringify(parsedMeetupLocations),
      JSON.stringify(parsedAvailability),
      special_instructions || null
    ]);

    await client.query('COMMIT');
    res.status(201).json(itemResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating item:', error);

    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(500).json({ error: 'Failed to create item' });
  } finally {
    client.release();
  }
});

// Get user's listings
router.get('/my-listings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.name as category_name, c.icon_name
      FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.seller_id = $1 AND i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Update item
router.put('/:id', authenticateToken, upload.array('photos', 10), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemId = req.params.id;
    const seller_id = req.user.id;

    // Check ownership
    const ownershipCheck = await client.query(
      'SELECT id FROM items WHERE id = $1 AND seller_id = $2',
      [itemId, seller_id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    const {
      title,
      description,
      price,
      condition,
      category_id,
      location_text,
      pickup_only,
      willing_to_ship,
      open_to_trades,
      status
    } = req.body;

    let photos = null;
    let primary_photo_url = null;

    if (req.files && req.files.length > 0) {
      photos = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename
      }));
      primary_photo_url = photos[0].url;
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) { updates.push(`title = $${paramCount++}`); values.push(title); }
    if (description) { updates.push(`description = $${paramCount++}`); values.push(description); }
    if (price) { updates.push(`price = $${paramCount++}`); values.push(parseFloat(price)); }
    if (condition) { updates.push(`condition = $${paramCount++}`); values.push(condition); }
    if (category_id) { updates.push(`category_id = $${paramCount++}`); values.push(category_id); }
    if (location_text !== undefined) { updates.push(`location_text = $${paramCount++}`); values.push(location_text); }
    if (pickup_only !== undefined) { updates.push(`pickup_only = $${paramCount++}`); values.push(pickup_only === 'true'); }
    if (willing_to_ship !== undefined) { updates.push(`willing_to_ship = $${paramCount++}`); values.push(willing_to_ship === 'true'); }
    if (open_to_trades !== undefined) { updates.push(`open_to_trades = $${paramCount++}`); values.push(open_to_trades === 'true'); }
    if (status) { updates.push(`status = $${paramCount++}`); values.push(status); }
    if (photos) { updates.push(`photos = $${paramCount++}`); values.push(JSON.stringify(photos)); }
    if (primary_photo_url) { updates.push(`primary_photo_url = $${paramCount++}`); values.push(primary_photo_url); }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(itemId); // for WHERE clause

    const query = `
      UPDATE items
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, values);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating item:', error);

    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(500).json({ error: 'Failed to update item' });
  } finally {
    client.release();
  }
});

// Delete item (soft delete) - works for both draft and available listings
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const seller_id = req.user.id;

    const result = await pool.query(`
      UPDATE items
      SET deleted_at = CURRENT_TIMESTAMP, status = 'unavailable'
      WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
      RETURNING id
    `, [itemId, seller_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found or not authorized' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;