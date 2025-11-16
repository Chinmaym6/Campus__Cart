# 🚀 RUN THIS FIRST - Marketplace Setup & Test

## ⚡ Quick Start (3 Steps)

### Step 1: Run Migrations (30 seconds)

```bash
cd backend
node run-saved-items-migration.js
```

**Expected:**
```
✓ Migration completed successfully!
✓ saved_items table created
```

---

### Step 2: Test Your Data (30 seconds)

```bash
node test-marketplace.js
```

**What to look for:**
- ✅ "X items ready to show in marketplace!" 
- ⚠️ If 0 items, see fix below

---

### Step 3: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

---

## 🌐 Access Marketplace

Open browser: **http://localhost:5173/marketplace**

---

## ⚠️ If No Items Show

### Quick Fix: Make Items Available

```sql
-- Connect to your database
psql $DATABASE_URL

-- Check item statuses
SELECT status, COUNT(*) FROM items WHERE deleted_at IS NULL GROUP BY status;

-- If items are 'draft', make them available:
UPDATE items SET status = 'available' WHERE deleted_at IS NULL;

-- Verify:
SELECT COUNT(*) FROM items WHERE status = 'available';
```

---

## ✅ What Was Fixed

### 1. Items Not Displaying ✅ FIXED
**Before:** Location filter excluded items without coordinates  
**After:** All items show, location is optional

### 2. Search Not Working ✅ FIXED
**Before:** Only searched titles  
**After:** Searches title AND description

### 3. Location Filter Not Working ✅ FIXED
**Before:** Always applied default 50mi filter  
**After:** Only filters when user explicitly sets distance

### 4. Security Vulnerability ✅ FIXED
**Before:** SQL injection risk  
**After:** Parameterized queries

---

## 🧪 Test Checklist

- [ ] Run `node test-marketplace.js` → Shows available items
- [ ] Backend starts → No errors
- [ ] Frontend starts → No errors
- [ ] Navigate to `/marketplace` → Page loads
- [ ] See items in grid → Items display
- [ ] Type "mac" in search → Suggestions appear
- [ ] Click suggestion → Results filter
- [ ] Select category → Results filter
- [ ] Set price range → Results filter
- [ ] Click heart icon → Item saves
- [ ] No browser console errors

---

## 🐛 Troubleshooting

### Problem: "0 items ready to show"

**Solution:**
```sql
UPDATE items SET status = 'available';
```

### Problem: "saved_items table does not exist"

**Solution:**
```bash
node run-saved-items-migration.js
```

### Problem: Backend won't start

**Solution:**
```bash
npm install
```

### Problem: Frontend shows "Network Error"

**Solution:**
- Check backend is running on port 3000
- Check `VITE_API_URL` in frontend

### Problem: Search suggestions don't appear

**Solution:**
- Check browser console (F12)
- Look for errors
- Test: `curl "http://localhost:3000/api/items/search-suggestions?q=test"`

---

## 🎯 Expected Behavior

### ✅ Browse Page
- Shows all available items
- Items without location still display
- Pagination works
- No errors

### ✅ Search
- Type → Suggestions appear in 300ms
- Shows recent searches
- Shows item matches
- Shows category matches

### ✅ Filters
- Category → Works
- Price range → Works
- Condition → Works
- Distance → Works (with location permission)
- Transaction type → Works
- Clear all → Resets everything

### ✅ Location
- Asks permission gracefully
- Shows distance when available
- Filters when distance selected
- Works without location

---

## 📊 Quick Test

Open browser console (F12) and check:

**Good (Working):**
```
Fetching items with params: {page: 1, limit: 24, sort_by: "newest"}
Response: {items: Array(5), total: 5, page: 1, pages: 1}
```

**Bad (Not Working):**
```
Error fetching items: Network Error
```

---

## 📁 Key Files Modified

- ✅ `backend/routes/items.js` - Fixed browse API
- ✅ `frontend/src/pages/Marketplace.jsx` - Fixed distance logic
- ✅ `backend/test-marketplace.js` - NEW: Test script
- ✅ `backend/run-saved-items-migration.js` - NEW: Migration
- ✅ `backend/config/add-saved-items.sql` - NEW: Schema

---

## 🎉 Success!

**You know it's working when:**
- Marketplace page loads
- Items appear in grid  
- Search shows suggestions
- Filters update results
- No console errors

---

## 📚 Documentation

- **MARKETPLACE_FIXES.md** - Detailed fix explanations
- **MARKETPLACE_FEATURE.md** - Complete feature docs
- **MARKETPLACE_SETUP.md** - Setup instructions
- **QUICK_START.txt** - Quick reference

---

## 💬 Still Stuck?

1. Run test script: `node test-marketplace.js`
2. Check browser console (F12)
3. Check backend terminal
4. Read `MARKETPLACE_FIXES.md`
5. Look for specific error messages

---

**Everything should work now! 🚀**
