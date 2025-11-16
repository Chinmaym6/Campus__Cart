# Messaging System - Setup & Troubleshooting

## Quick Start

### 1. Database Migration (Already Done ✓)
```bash
cd backend
node run-messaging-migration.js
```

### 2. Start Backend Server
```bash
cd backend
npm start
```

**IMPORTANT:** If you get 500 errors, the backend needs to be restarted to load the new routes!

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

## Testing the Fix

### Test 1: Access Messages Page
1. Login to your account
2. Click "💬 Messages" in the navbar
3. Should show empty state (no errors)

### Test 2: Create Conversation
1. Go to Marketplace
2. Click on any item
3. Click "💬 Message Seller" button
4. Should open chat interface (no 500 error)

### Test 3: Send Message
1. In chat interface
2. See quick action templates (first message only)
3. Type a message or click a template
4. Click send
5. Message should appear in chat

## Common Errors & Solutions

### Error: 500 Internal Server Error

**Cause:** Backend server not restarted after code changes

**Solution:**
```bash
cd backend
# Stop server (Ctrl+C)
npm start
```

### Error: "Failed to load conversations"

**Causes:**
1. Backend not running
2. Database not migrated
3. Wrong API URL

**Solutions:**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Should return: {"status":"ok","message":"Campus Cart API is running"}

# If not running, start it:
cd backend
npm start

# Check database migration
node test-messages.js
```

### Error: "Cannot message yourself"

**Cause:** Trying to message your own listing

**Solution:** This is correct behavior - you cannot message yourself!

## Verification Checklist

- [ ] Database tables created (run `node test-messages.js`)
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can access /messages page
- [ ] Can click "Message Seller" on item
- [ ] Can see chat interface
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Unread counts work
- [ ] UI matches marketplace theme

## Database Check

Run this to verify database setup:
```bash
cd backend
node test-messages.js
```

Should output:
```
✅ All tests passed!
```

## API Endpoints

Test manually with curl:

### Get Conversations
```bash
curl -X GET http://localhost:5000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Conversation
```bash
curl -X POST http://localhost:5000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemId": "ITEM_UUID"}'
```

### Get Messages
```bash
curl -X GET http://localhost:5000/api/messages/conversations/CONV_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## UI Theme Match

The messaging system now uses the same dark theme as Marketplace:
- Purple/blue gradient backgrounds
- Dark cards with blur effects
- Glowing purple borders on hover
- Consistent typography and spacing
- Smooth animations

## File Changes

### Backend Files Modified:
- `backend/routes/messages.js` - Fixed JSON queries
- `backend/config/create-messaging-tables.sql` - Database schema
- `backend/server.js` - Added messages routes

### Frontend Files Modified:
- `frontend/src/pages/Messages.jsx` - Conversations list
- `frontend/src/pages/Messages.css` - Updated to match marketplace theme
- `frontend/src/pages/Chat.jsx` - Chat interface
- `frontend/src/pages/Chat.css` - Chat styling
- `frontend/src/pages/ItemDetails.jsx` - Added message button
- `frontend/src/components/Navbar.jsx` - Added messages link
- `frontend/src/App.jsx` - Added routes

## Next Steps

After verifying everything works:

1. Test with two different user accounts
2. Create a conversation
3. Send messages back and forth
4. Verify read receipts work
5. Check unread counts
6. Test real-time updates

## Support

If issues persist:

1. Check browser console for errors
2. Check backend terminal for errors
3. Verify database connection
4. Ensure all files are saved
5. Clear browser cache
6. Restart both servers
