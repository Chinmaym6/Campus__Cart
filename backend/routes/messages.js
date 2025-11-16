import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.item_id,
        c.buyer_id,
        c.seller_id,
        c.status,
        c.last_message_at,
        c.last_message_preview,
        c.created_at,
        c.updated_at,
        i.title as item_title,
        i.price as item_price,
        i.primary_photo_url as item_photo,
        i.status as item_status,
        CASE 
          WHEN c.buyer_id = $1 THEN c.unread_count_buyer
          ELSE c.unread_count_seller
        END as unread_count,
        CASE 
          WHEN c.buyer_id = $1 THEN c.seller_id
          ELSE c.buyer_id
        END as other_user_id,
        CASE 
          WHEN c.buyer_id = $1 THEN 
            (SELECT u.first_name FROM users u WHERE u.id = c.seller_id)
          ELSE 
            (SELECT u.first_name FROM users u WHERE u.id = c.buyer_id)
        END as other_user_first_name,
        CASE 
          WHEN c.buyer_id = $1 THEN 
            (SELECT u.last_name FROM users u WHERE u.id = c.seller_id)
          ELSE 
            (SELECT u.last_name FROM users u WHERE u.id = c.buyer_id)
        END as other_user_last_name,
        CASE 
          WHEN c.buyer_id = $1 THEN 
            (SELECT u.email FROM users u WHERE u.id = c.seller_id)
          ELSE 
            (SELECT u.email FROM users u WHERE u.id = c.buyer_id)
        END as other_user_email,
        CASE 
          WHEN c.buyer_id = $1 THEN 
            (SELECT u.profile_photo_url FROM users u WHERE u.id = c.seller_id)
          ELSE 
            (SELECT u.profile_photo_url FROM users u WHERE u.id = c.buyer_id)
        END as other_user_profile_photo
      FROM conversations c
      LEFT JOIN items i ON c.item_id = i.id
      WHERE (c.buyer_id = $1 OR c.seller_id = $1)
        AND c.status = 'active'
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `, [userId]);

    // Format the response
    const conversations = result.rows.map(row => ({
      id: row.id,
      item_id: row.item_id,
      buyer_id: row.buyer_id,
      seller_id: row.seller_id,
      status: row.status,
      last_message_at: row.last_message_at,
      last_message_preview: row.last_message_preview,
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_title: row.item_title,
      item_price: row.item_price,
      item_photo: row.item_photo,
      item_status: row.item_status,
      unread_count: row.unread_count,
      other_user: {
        id: row.other_user_id,
        firstName: row.other_user_first_name,
        lastName: row.other_user_last_name,
        email: row.other_user_email,
        fullName: `${row.other_user_first_name} ${row.other_user_last_name}`,
        profilePhoto: row.other_user_profile_photo
      }
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
});

// Get or create a conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { itemId } = req.body;
    const buyerId = req.user.id;

    // Get seller_id from item
    const itemResult = await client.query(
      'SELECT seller_id FROM items WHERE id = $1',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const sellerId = itemResult.rows[0].seller_id;

    // Don't allow messaging yourself
    if (sellerId === buyerId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if conversation exists
    let result = await client.query(
      `SELECT c.id,
        c.item_id,
        c.buyer_id,
        c.seller_id,
        c.status,
        c.last_message_at,
        c.last_message_preview,
        c.created_at,
        c.updated_at,
        i.title as item_title,
        i.price as item_price,
        i.primary_photo_url as item_photo,
        i.status as item_status,
        c.unread_count_buyer as unread_count,
        u.id as other_user_id,
        u.first_name as other_user_first_name,
        u.last_name as other_user_last_name,
        u.email as other_user_email,
        u.profile_photo_url as other_user_profile_photo
      FROM conversations c
      LEFT JOIN items i ON c.item_id = i.id
      LEFT JOIN users u ON u.id = c.seller_id
      WHERE c.item_id = $1 AND c.buyer_id = $2`,
      [itemId, buyerId]
    );

    if (result.rows.length === 0) {
      // Create new conversation
      await client.query('BEGIN');
      
      const insertResult = await client.query(
        `INSERT INTO conversations (item_id, buyer_id, seller_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [itemId, buyerId, sellerId]
      );

      const conversationId = insertResult.rows[0].id;

      // Get full conversation details
      result = await client.query(
        `SELECT c.id,
          c.item_id,
          c.buyer_id,
          c.seller_id,
          c.status,
          c.last_message_at,
          c.last_message_preview,
          c.created_at,
          c.updated_at,
          i.title as item_title,
          i.price as item_price,
          i.primary_photo_url as item_photo,
          i.status as item_status,
          c.unread_count_buyer as unread_count,
          u.id as other_user_id,
          u.first_name as other_user_first_name,
          u.last_name as other_user_last_name,
          u.email as other_user_email,
          u.profile_photo_url as other_user_profile_photo
        FROM conversations c
        LEFT JOIN items i ON c.item_id = i.id
        LEFT JOIN users u ON u.id = c.seller_id
        WHERE c.id = $1`,
        [conversationId]
      );

      await client.query('COMMIT');
    }

    const row = result.rows[0];
    const conversation = {
      id: row.id,
      item_id: row.item_id,
      buyer_id: row.buyer_id,
      seller_id: row.seller_id,
      status: row.status,
      last_message_at: row.last_message_at,
      last_message_preview: row.last_message_preview,
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_title: row.item_title,
      item_price: row.item_price,
      item_photo: row.item_photo,
      item_status: row.item_status,
      unread_count: row.unread_count,
      other_user: {
        id: row.other_user_id,
        firstName: row.other_user_first_name,
        lastName: row.other_user_last_name,
        email: row.other_user_email,
        fullName: `${row.other_user_first_name} ${row.other_user_last_name}`,
        profilePhoto: row.other_user_profile_photo
      }
    };

    res.json(conversation);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating conversation:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create conversation', details: error.message });
  } finally {
    client.release();
  }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { limit = 50, before } = req.query;

    // Verify user is part of conversation
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let query = `
      SELECT m.id,
        m.conversation_id,
        m.sender_id,
        m.recipient_id,
        m.content,
        m.message_type,
        m.attachment_url,
        m.location_data,
        m.read_at,
        m.created_at,
        u.id as sender_user_id,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.email as sender_email,
        u.profile_photo_url as sender_profile_photo
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
    `;
    const params = [conversationId];

    if (before) {
      query += ` AND m.created_at < $${params.length + 1}`;
      params.push(before);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    // Format the response
    const messages = result.rows.map(row => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      recipient_id: row.recipient_id,
      content: row.content,
      message_type: row.message_type,
      attachment_url: row.attachment_url,
      location_data: row.location_data,
      read_at: row.read_at,
      created_at: row.created_at,
      sender: {
        id: row.sender_user_id,
        firstName: row.sender_first_name,
        lastName: row.sender_last_name,
        email: row.sender_email,
        fullName: `${row.sender_first_name} ${row.sender_last_name}`,
        profilePhoto: row.sender_profile_photo
      }
    }));

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', locationData } = req.body;
    const senderId = req.user.id;

    await client.query('BEGIN');

    // Verify user is part of conversation and get recipient
    const convResult = await client.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, senderId]
    );

    if (convResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversation = convResult.rows[0];
    const recipientId = conversation.buyer_id === senderId 
      ? conversation.seller_id 
      : conversation.buyer_id;

    // Insert message
    const messageResult = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, recipient_id, content, message_type, location_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [conversationId, senderId, recipientId, content, messageType, locationData || null]
    );

    // Update conversation
    const unreadField = conversation.buyer_id === senderId 
      ? 'unread_count_seller' 
      : 'unread_count_buyer';

    await client.query(
      `UPDATE conversations 
       SET last_message_at = NOW(),
           last_message_preview = $1,
           ${unreadField} = ${unreadField} + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [content.substring(0, 100), conversationId]
    );

    // Get sender info
    const senderResult = await client.query(
      `SELECT id, first_name, last_name, email, profile_photo_url 
       FROM users WHERE id = $1`,
      [senderId]
    );

    await client.query('COMMIT');

    const message = {
      ...messageResult.rows[0],
      sender: {
        id: senderResult.rows[0].id,
        firstName: senderResult.rows[0].first_name,
        lastName: senderResult.rows[0].last_name,
        email: senderResult.rows[0].email,
        fullName: `${senderResult.rows[0].first_name} ${senderResult.rows[0].last_name}`,
        profilePhoto: senderResult.rows[0].profile_photo_url
      }
    };

    res.status(201).json(message);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    client.release();
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Verify user is part of conversation
    const convResult = await client.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversation = convResult.rows[0];

    // Mark all unread messages as read
    await client.query(
      `UPDATE messages 
       SET read_at = NOW()
       WHERE conversation_id = $1 
         AND recipient_id = $2 
         AND read_at IS NULL`,
      [conversationId, userId]
    );

    // Reset unread count
    const unreadField = conversation.buyer_id === userId 
      ? 'unread_count_buyer' 
      : 'unread_count_seller';

    await client.query(
      `UPDATE conversations 
       SET ${unreadField} = 0
       WHERE id = $1`,
      [conversationId]
    );

    await client.query('COMMIT');

    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  } finally {
    client.release();
  }
});

// Get message templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM message_templates 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Check if conversation has messages (for showing templates only on first message)
router.get('/conversations/:conversationId/has-messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of conversation
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1',
      [conversationId]
    );

    res.json({ hasMessages: parseInt(result.rows[0].count) > 0 });
  } catch (error) {
    console.error('Error checking messages:', error);
    res.status(500).json({ error: 'Failed to check messages' });
  }
});

export default router;
