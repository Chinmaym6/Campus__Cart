import express from "express";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { reverseGeocode } from "../utils/geocoding.js";

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/listings/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Get all categories
router.get("/categories", async (req, res) => {
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
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create a new item listing
router.post(
  "/",
  authenticateToken,
  upload.array("photos", 10),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        title,
        description,
        price,
        condition,
        category_id,
        location_text,
        location_lat,
        location_lng,
        location_description,
        meetup_location_text,
        meetup_location_lat,
        meetup_location_lng,
        meetup_description,
        pickup_only,
        willing_to_ship,
        negotiable,
        firm,
        payment_methods,
        open_to_trades,
        trade_description,
        trade_preference,
        availability,
        special_instructions,
        status = "draft",
      } = req.body;

      // Use new parameter names, fallback to old for backward compatibility
      const latitude = location_lat;
      const longitude = location_lng;
      const meetup_latitude = meetup_location_lat;
      const meetup_longitude = meetup_location_lng;

      const seller_id = req.user.id;

      // Log incoming data for debugging
      console.log("POST /items - Received data:", {
        location_description,
        meetup_description,
        latitude,
        longitude,
        meetup_latitude,
        meetup_longitude,
        open_to_trades,
        trade_description,
        trade_preference,
        negotiable,
        firm,
        pickup_only,
        willing_to_ship,
      });

      // Validate required fields
      if (!title || !description || !price || !condition || !category_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate photos (minimum 3 for available, 0 for draft)
      const minPhotos = status === "available" ? 3 : 0;
      if (!req.files || req.files.length < minPhotos) {
        return res
          .status(400)
          .json({
            error: `At least ${minPhotos} photos are required for ${status} listings`,
          });
      }

      // Process photos
      const photos = req.files
        ? req.files.map((file) => ({
            url: `/uploads/listings/${file.filename}`,
            filename: file.filename,
          }))
        : [];

      const primary_photo_url = photos.length > 0 ? photos[0].url : null;

      // Parse JSON fields
      let parsedPaymentMethods = [];
      let parsedAvailability = [];

      try {
        if (payment_methods) {
          parsedPaymentMethods =
            typeof payment_methods === "string"
              ? JSON.parse(payment_methods)
              : payment_methods;
        }
        if (availability) {
          parsedAvailability =
            typeof availability === "string"
              ? JSON.parse(availability)
              : availability;
        }
      } catch (e) {
        console.error("Error parsing JSON fields:", e);
      }

      // Normalize condition value to match database enum
      const conditionMap = {
        brand_new: "brand_new",
        "Brand New": "brand_new",
        like_new: "like_new",
        "Like New": "like_new",
        good: "good",
        Good: "good",
        fair: "fair",
        Fair: "fair",
        for_parts: "for_parts",
        "For Parts": "for_parts",
      };
      const normalizedCondition =
        conditionMap[condition] || condition.toLowerCase().replace(/\s+/g, "_");

      // Use provided location text from frontend (already auto-detected via reverse geocoding)
      const finalLocationText = location_text || "";
      const finalMeetupLocationText = meetup_location_text || "";

      // Insert item - Build query dynamically based on available coordinates
      const hasListingLocation = latitude && longitude;
      const hasMeetupLocation = meetup_latitude && meetup_longitude;

      let columns = [
        "seller_id",
        "category_id",
        "title",
        "description",
        "price",
        "condition",
        "status",
        "location_text",
        "location_description",
        "pickup_only",
        "willing_to_ship",
        "photos",
        "primary_photo_url",
        "negotiable",
        "firm",
        "payment_methods",
        "open_to_trades",
        "trade_description",
        "trade_preference",
        "meetup_locations",
        "meetup_location_text",
        "meetup_description",
        "availability",
        "special_instructions",
      ];

      let values = [
        seller_id,
        category_id,
        title,
        description,
        parseFloat(price),
        normalizedCondition,
        status,
        finalLocationText,
        location_description || null,
        pickup_only === "true" || pickup_only === true,
        willing_to_ship === "true" || willing_to_ship === true,
        JSON.stringify(photos),
        primary_photo_url,
        negotiable === "true" || negotiable === true,
        firm === "true" || firm === true,
        JSON.stringify(parsedPaymentMethods),
        open_to_trades === "true" ||
          open_to_trades === true ||
          open_to_trades === "on",
        trade_description || null,
        trade_preference || null,
        JSON.stringify([]), // Empty array for meetup_locations (deprecated, using meetup_location_text now)
        finalMeetupLocationText,
        meetup_description || null,
        JSON.stringify(parsedAvailability),
        special_instructions || null,
      ];

      let paramIndex = values.length + 1;
      let valuePlaceholders = values.map((_, i) => `$${i + 1}`);

      // Add listing location if provided
      if (hasListingLocation) {
        columns.push("location");
        valuePlaceholders.push(
          `ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)`
        );
        values.push(parseFloat(longitude), parseFloat(latitude));
      }

      // Add meetup location if provided
      if (hasMeetupLocation) {
        columns.push("meetup_location");
        valuePlaceholders.push(
          `ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)`
        );
        values.push(parseFloat(meetup_longitude), parseFloat(meetup_latitude));
      }

      const queryText = `
      INSERT INTO items (${columns.join(", ")})
      VALUES (${valuePlaceholders.join(", ")})
      RETURNING *
    `;

      console.log("Inserting with location_description:", location_description);
      console.log("Inserting with meetup_description:", meetup_description);
      console.log("Values array includes:", {
        location_desc_index: columns.indexOf("location_description"),
        meetup_desc_index: columns.indexOf("meetup_description"),
        location_desc_value: values[columns.indexOf("location_description")],
        meetup_desc_value: values[columns.indexOf("meetup_description")],
      });

      const itemResult = await client.query(queryText, values);

      await client.query("COMMIT");
      res.status(201).json(itemResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating item:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      if (error.code) console.error("Error code:", error.code);

      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }

      res.status(500).json({
        error: "Failed to create item",
        details: error.message,
        code: error.code,
      });
    } finally {
      client.release();
    }
  }
);

// Get user's listings
// Get user's listings (with alias routes)
router.get("/my-listings", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT i.*, 
        c.name as category_name, 
        c.icon_name,
        ST_Y(i.location::geometry) as location_lat,
        ST_X(i.location::geometry) as location_lng,
        ST_Y(i.meetup_location::geometry) as meetup_location_lat,
        ST_X(i.meetup_location::geometry) as meetup_location_lng
      FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.seller_id = $1 AND i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// Alias route for user listings
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT i.*, 
        c.name as category_name, 
        c.icon_name,
        ST_Y(i.location::geometry) as location_lat,
        ST_X(i.location::geometry) as location_lng,
        ST_Y(i.meetup_location::geometry) as meetup_location_lat,
        ST_X(i.meetup_location::geometry) as meetup_location_lng
      FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.seller_id = $1 AND i.deleted_at IS NULL
      ORDER BY i.created_at DESC
    `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// Update item
router.put(
  "/:id",
  authenticateToken,
  upload.array("photos", 10),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const itemId = req.params.id;
      const seller_id = req.user.id;

      // Check ownership
      const ownershipCheck = await client.query(
        "SELECT id FROM items WHERE id = $1 AND seller_id = $2",
        [itemId, seller_id]
      );

      if (ownershipCheck.rows.length === 0) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this item" });
      }

      const {
        title,
        description,
        price,
        condition,
        category_id,
        location_text,
        location_lat,
        location_lng,
        location_description,
        meetup_location_text,
        meetup_location_lat,
        meetup_location_lng,
        meetup_description,
        pickup_only,
        willing_to_ship,
        negotiable,
        firm,
        payment_methods,
        open_to_trades,
        trade_description,
        trade_preference,
        availability,
        special_instructions,
        status,
      } = req.body;

      // Use new parameter names, fallback to old for backward compatibility
      const latitude = location_lat;
      const longitude = location_lng;
      const meetup_latitude = meetup_location_lat;
      const meetup_longitude = meetup_location_lng;

      let photos = null;
      let primary_photo_url = null;

      if (req.files && req.files.length > 0) {
        photos = req.files.map((file) => ({
          url: `/uploads/listings/${file.filename}`,
          filename: file.filename,
        }));
        primary_photo_url = photos[0].url;
      }

      // Use provided location text from frontend (already auto-detected via reverse geocoding)

      // Log incoming data for debugging
      console.log("PUT /items/:id - Received data:", {
        location_description,
        meetup_description,
        latitude,
        longitude,
        meetup_latitude,
        meetup_longitude,
      });

      // Parse JSON fields like in POST route
      let parsedPaymentMethods = [];
      let parsedAvailability = [];

      try {
        if (payment_methods) {
          parsedPaymentMethods =
            typeof payment_methods === "string"
              ? JSON.parse(payment_methods)
              : payment_methods;
        }
        if (availability) {
          parsedAvailability =
            typeof availability === "string"
              ? JSON.parse(availability)
              : availability;
        }
      } catch (e) {
        console.error("Error parsing JSON fields in PUT:", e);
      }

      // Build update query dynamically - use !== undefined to allow falsy values
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (price !== undefined) {
        updates.push(`price = $${paramCount++}`);
        values.push(parseFloat(price));
      }
      if (condition !== undefined) {
        updates.push(`condition = $${paramCount++}`);
        values.push(condition);
      }
      if (category_id !== undefined) {
        updates.push(`category_id = $${paramCount++}`);
        values.push(category_id);
      }
      if (location_text !== undefined) {
        updates.push(`location_text = $${paramCount++}`);
        values.push(location_text);
      }
      if (location_description !== undefined) {
        console.log("Updating location_description to:", location_description);
        updates.push(`location_description = $${paramCount++}`);
        values.push(location_description);
      }
      if (latitude !== undefined && longitude !== undefined) {
        updates.push(
          `location = ST_SetSRID(ST_MakePoint($${paramCount++}, $${paramCount++}), 4326)`
        );
        values.push(parseFloat(longitude));
        values.push(parseFloat(latitude));
      }
      if (meetup_location_text !== undefined) {
        updates.push(`meetup_location_text = $${paramCount++}`);
        values.push(meetup_location_text);
      }
      if (meetup_description !== undefined) {
        console.log("Updating meetup_description to:", meetup_description);
        updates.push(`meetup_description = $${paramCount++}`);
        values.push(meetup_description);
      }
      if (meetup_latitude !== undefined && meetup_longitude !== undefined) {
        updates.push(
          `meetup_location = ST_SetSRID(ST_MakePoint($${paramCount++}, $${paramCount++}), 4326)`
        );
        values.push(parseFloat(meetup_longitude));
        values.push(parseFloat(meetup_latitude));
      }
      if (pickup_only !== undefined) {
        updates.push(`pickup_only = $${paramCount++}`);
        values.push(pickup_only === "true" || pickup_only === true);
      }
      if (willing_to_ship !== undefined) {
        updates.push(`willing_to_ship = $${paramCount++}`);
        values.push(willing_to_ship === "true" || willing_to_ship === true);
      }
      if (negotiable !== undefined) {
        updates.push(`negotiable = $${paramCount++}`);
        values.push(negotiable === "true" || negotiable === true);
      }
      if (firm !== undefined) {
        updates.push(`firm = $${paramCount++}`);
        values.push(firm === "true" || firm === true);
      }
      if (payment_methods !== undefined) {
        updates.push(`payment_methods = $${paramCount++}`);
        values.push(JSON.stringify(parsedPaymentMethods));
      }
      if (open_to_trades !== undefined) {
        updates.push(`open_to_trades = $${paramCount++}`);
        values.push(open_to_trades === "true" || open_to_trades === true);
      }
      if (trade_description !== undefined) {
        updates.push(`trade_description = $${paramCount++}`);
        values.push(trade_description);
      }
      if (trade_preference !== undefined) {
        updates.push(`trade_preference = $${paramCount++}`);
        values.push(trade_preference);
      }
      if (availability !== undefined) {
        updates.push(`availability = $${paramCount++}`);
        values.push(JSON.stringify(parsedAvailability));
      }
      if (special_instructions !== undefined) {
        updates.push(`special_instructions = $${paramCount++}`);
        values.push(special_instructions);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }
      if (photos) {
        updates.push(`photos = $${paramCount++}`);
        values.push(JSON.stringify(photos));
      }
      if (primary_photo_url) {
        updates.push(`primary_photo_url = $${paramCount++}`);
        values.push(primary_photo_url);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(itemId); // for WHERE clause

      const query = `
      UPDATE items
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

      const result = await client.query(query, values);

      await client.query("COMMIT");
      res.json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating item:", error);

      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }

      res.status(500).json({ error: "Failed to update item" });
    } finally {
      client.release();
    }
  }
);

// Delete item (soft delete) - works for both draft and available listings
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const seller_id = req.user.id;

    const result = await pool.query(
      `
      UPDATE items
      SET deleted_at = CURRENT_TIMESTAMP, status = 'unavailable'
      WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
      RETURNING id
    `,
      [itemId, seller_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Item not found or not authorized" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Browse marketplace items (public, with filters)
router.get("/browse", async (req, res) => {
  try {
    const {
      search = "",
      category_id,
      min_price,
      max_price,
      condition,
      transaction_type,
      min_rating,
      date_posted,
      has_video,
      verified_only,
      lat,
      lng,
      distance = 50,
      sort_by = "newest",
      page = 1,
      limit = 24,
      user_id,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = ["i.status = 'available'", "i.deleted_at IS NULL"];
    let queryParams = [];
    let paramCount = 1;

    // Exclude user's own listings
    if (user_id) {
      whereConditions.push(`i.seller_id != $${paramCount}`);
      queryParams.push(user_id);
      paramCount++;
    }

    // Search filter
    if (search) {
      whereConditions.push(
        `(i.title ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`
      );
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Category filter
    if (category_id) {
      whereConditions.push(`i.category_id = $${paramCount}`);
      queryParams.push(category_id);
      paramCount++;
    }

    // Price range filter
    if (min_price) {
      whereConditions.push(`i.price >= $${paramCount}`);
      queryParams.push(parseFloat(min_price));
      paramCount++;
    }
    if (max_price) {
      whereConditions.push(`i.price <= $${paramCount}`);
      queryParams.push(parseFloat(max_price));
      paramCount++;
    }

    // Condition filter
    if (condition) {
      const conditions = condition.split(",");
      whereConditions.push(
        `i.condition = ANY($${paramCount}::item_condition[])`
      );
      queryParams.push(conditions);
      paramCount++;
    }

    // Transaction type filter
    if (transaction_type === "cash") {
      whereConditions.push(`payment_methods @> '["cash"]'::jsonb`);
    } else if (transaction_type === "digital") {
      whereConditions.push(
        `(payment_methods @> '["venmo"]'::jsonb OR payment_methods @> '["paypal"]'::jsonb OR payment_methods @> '["zelle"]'::jsonb)`
      );
    } else if (transaction_type === "trade") {
      whereConditions.push(`open_to_trades = true`);
    }

    // Date posted filter
    if (date_posted === "today") {
      whereConditions.push(`i.created_at >= NOW() - INTERVAL '24 hours'`);
    } else if (date_posted === "week") {
      whereConditions.push(`i.created_at >= NOW() - INTERVAL '7 days'`);
    } else if (date_posted === "month") {
      whereConditions.push(`i.created_at >= NOW() - INTERVAL '30 days'`);
    }

    // Distance calculation and filtering (optional, graceful)
    let distanceSelect = "NULL as distance";
    const hasCoords = lat && lng;

    if (hasCoords) {
      const lonParam = `$${paramCount}`;
      const latParam = `$${paramCount + 1}`;

      distanceSelect = `ROUND(ST_DistanceSphere(
        i.location::geometry,
        ST_SetSRID(ST_MakePoint(${lonParam}, ${latParam}), 4326)
      ) / 1609.34, 1) as distance`;

      // Only apply distance filter if user explicitly wants it
      // AND include items without location (OR i.location IS NULL)
      const distanceValue = parseFloat(distance);
      if (distanceValue > 0 && distanceValue < 100) {
        whereConditions.push(`(
          i.location IS NULL OR
          ST_DWithin(
            i.location::geography,
            ST_SetSRID(ST_MakePoint(${lonParam}, ${latParam}), 4326)::geography,
            ${distanceValue * 1609.34}
          )
        )`);
      }

      queryParams.push(parseFloat(lng), parseFloat(lat));
      paramCount += 2;
    }

    // Build ORDER BY clause
    let orderBy = "i.created_at DESC";
    if (sort_by === "price_low") {
      orderBy = "i.price ASC, i.created_at DESC";
    } else if (sort_by === "price_high") {
      orderBy = "i.price DESC, i.created_at DESC";
    } else if (sort_by === "nearest" && lat && lng) {
      orderBy = "distance ASC, i.created_at DESC";
    } else if (sort_by === "popular") {
      orderBy = "(i.view_count + i.save_count * 2) DESC, i.created_at DESC";
    }

    // Check if we need to include saved status (parameterized for security)
    let savedSelect = "FALSE as is_saved";
    let savedJoin = "";

    if (user_id) {
      // Find the position of user_id in queryParams (it was added for seller_id filter)
      const userIdParamIndex = queryParams.indexOf(user_id) + 1;
      savedSelect = `COALESCE(si.is_saved, FALSE) as is_saved`;
      savedJoin = `LEFT JOIN (
        SELECT item_id, TRUE as is_saved
        FROM saved_items
        WHERE user_id = $${userIdParamIndex}
      ) si ON si.item_id = i.id`;
    }

    // Main query with LEFT JOINs to handle missing relations gracefully
    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        c.icon_name,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name,
        u.profile_photo_url as seller_photo,
        ST_Y(i.location::geometry) as location_lat,
        ST_X(i.location::geometry) as location_lng,
        ${distanceSelect},
        ${savedSelect},
        EXTRACT(EPOCH FROM (NOW() - i.created_at)) as seconds_ago
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.seller_id = u.id
      ${savedJoin}
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM items i
      WHERE ${whereConditions.join(" AND ")}
    `;

    const [itemsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)),
    ]);

    res.json({
      items: itemsResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error browsing items:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch items", details: error.message });
  }
});

// Search suggestions (autocomplete)
router.get("/search-suggestions", async (req, res) => {
  try {
    const { q = "" } = req.query;

    if (q.length < 2) {
      return res.json({ suggestions: [], categories: [] });
    }

    // Get matching item titles - include all non-deleted items for better suggestions
    const itemsQuery = `
      SELECT DISTINCT title
      FROM items
      WHERE deleted_at IS NULL
        AND (title ILIKE $1 OR description ILIKE $1)
      ORDER BY title
      LIMIT 5
    `;

    // Get matching categories
    const categoriesQuery = `
      SELECT name, slug, id
      FROM categories
      WHERE is_active = true
        AND name ILIKE $1
      ORDER BY sort_order, name
      LIMIT 3
    `;

    const searchPattern = `%${q}%`;

    const [itemsResult, categoriesResult] = await Promise.all([
      pool.query(itemsQuery, [searchPattern]),
      pool.query(categoriesQuery, [searchPattern]),
    ]);

    res.json({
      suggestions: itemsResult.rows.map((r) => r.title),
      categories: categoriesResult.rows,
    });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch suggestions", details: error.message });
  }
});

// Increment view count
router.post("/:id/view", async (req, res) => {
  try {
    const itemId = req.params.id;

    await pool.query(
      `
      UPDATE items
      SET view_count = view_count + 1
      WHERE id = $1
    `,
      [itemId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ error: "Failed to increment view count" });
  }
});

// Get saved items (requires auth)
router.get("/saved", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        c.icon_name,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name,
        u.profile_photo_url as seller_photo,
        si.created_at as saved_at
      FROM saved_items si
      JOIN items i ON si.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE si.user_id = $1
        AND i.deleted_at IS NULL
      ORDER BY si.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching saved items:", error);
    res.status(500).json({ error: "Failed to fetch saved items" });
  }
});

// Get single item by ID
router.get("/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user?.id; // Optional - to check if user saved it

    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        c.icon_name,
        u.first_name as seller_first_name,
        u.last_name as seller_last_name,
        u.profile_photo_url as seller_photo,
        u.avg_rating as seller_rating,
        u.total_reviews_received as seller_reviews,
        u.level as seller_level,
        ST_Y(i.location::geometry) as location_lat,
        ST_X(i.location::geometry) as location_lng,
        ${userId ? `(SELECT TRUE FROM saved_items WHERE user_id = $2 AND item_id = i.id LIMIT 1) as is_saved` : 'FALSE as is_saved'}
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE i.id = $1 AND i.deleted_at IS NULL
    `;

    const params = userId ? [itemId, userId] : [itemId];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// Save/unsave item (requires auth)
router.post("/:id/save", authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    // Check if already saved
    const checkQuery = `
      SELECT id FROM saved_items
      WHERE user_id = $1 AND item_id = $2
    `;

    const existingResult = await pool.query(checkQuery, [userId, itemId]);

    if (existingResult.rows.length > 0) {
      // Unsave
      await pool.query(
        `DELETE FROM saved_items WHERE user_id = $1 AND item_id = $2`,
        [userId, itemId]
      );
      await pool.query(
        `UPDATE items SET save_count = save_count - 1 WHERE id = $1`,
        [itemId]
      );
      res.json({ saved: false });
    } else {
      // Save
      await pool.query(
        `
        INSERT INTO saved_items (user_id, item_id)
        VALUES ($1, $2)
      `,
        [userId, itemId]
      );
      await pool.query(
        `UPDATE items SET save_count = save_count + 1 WHERE id = $1`,
        [itemId]
      );
      res.json({ saved: true });
    }
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ error: "Failed to save item" });
  }
});

export default router;
