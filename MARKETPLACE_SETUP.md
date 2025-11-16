# 🚀 Quick Start Guide - Marketplace Feature

## Step 1: Run Database Migration

Open terminal in the `backend` folder and run:

```bash
node run-saved-items-migration.js
```

You should see:
```
Running saved_items table migration...
✓ Migration completed successfully!
✓ saved_items table created
✓ All done!
```

## Step 2: Start the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm start
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

## Step 3: Access the Marketplace

1. Open your browser to `http://localhost:5173`
2. Log in with your credentials
3. Click **"Browse Items"** on the Dashboard
   - OR click **"Browse"** in the navigation bar
   - OR go directly to `http://localhost:5173/marketplace`

## 🎯 What You'll See

### Marketplace Page Features:

**Header**
- 🛍️ Marketplace title with icon
- 🔍 Smart search bar with autocomplete
- 🔔 Notification icon
- 👤 User avatar

**Filters**
- ⚙️ Filter drawer button (with active count badge)
- 📁 Category dropdown
- ✨ Condition dropdown  
- 🔽 Sort dropdown
- ❌ Clear all filters button

**Item Grid**
- Responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- Beautiful item cards with:
  - Item image
  - ❤️ Save/favorite button
  - 🏷️ Condition badge
  - 💲 Price
  - 📍 Distance (if location enabled)
  - 👁️ View count
  - 💾 Save count
  - 👤 Seller info
  - ⏰ Time posted

**Advanced Filters (in drawer)**
- 💰 Price range slider
- 📍 Distance selector (1, 5, 10, 25, 50 miles)
- 💳 Transaction type (Cash, Digital, Trade)
- 📅 Date posted filter
- Reset and Apply buttons

**Pagination**
- Page numbers
- Previous/Next buttons
- Shows total items found

## 🔍 Try These Features

### 1. Search
- Type in the search bar
- See autocomplete suggestions appear
- Click a suggestion or press Enter
- Your search will be saved to "Recent Searches"

### 2. Filter by Category
- Select a category from dropdown
- Items will filter instantly
- URL will update with your selection

### 3. Filter by Price
- Click "⚙️ Filters" button
- Enter min and/or max price
- Click "Apply Filters"

### 4. Filter by Distance
- Allow location access when prompted
- Click "⚙️ Filters" button
- Select distance radius (e.g., "10 mi")
- See only items within that distance

### 5. Sort Items
- Use the sort dropdown:
  - Newest First
  - Lowest Price
  - Highest Price
  - Nearest First (if location enabled)
  - Most Popular

### 6. Save Items
- Click the ❤️ button on any item
- Item will be saved to your favorites
- Save count will increment

### 7. Share Filtered Results
- Apply any filters
- Copy the URL from your browser
- Share it - filters are preserved in URL!

## 🎨 UI Features to Notice

### Animations
- Smooth hover effects on cards (lift and glow)
- Filter drawer slides in from right
- Search suggestions fade in
- Button hover effects

### Responsive Design
- Try resizing your browser window
- Check on mobile device (or mobile view in dev tools)
- Layout adapts to screen size

### Loading States
- Skeleton cards while loading
- Search loading indicator
- Smooth transitions

### Empty States
- Search for something that doesn't exist
- See friendly "No items found" message
- Clear filters button to reset

## 🧪 Testing Checklist

- [ ] Page loads without errors
- [ ] Search bar works and shows suggestions
- [ ] Category filter works
- [ ] Condition filter works
- [ ] Price filter works
- [ ] Distance filter works (with location)
- [ ] Sort options work
- [ ] Pagination works
- [ ] Save/favorite button works (when logged in)
- [ ] Clear filters button works
- [ ] Recent searches appear
- [ ] URL updates with filters
- [ ] Responsive on mobile
- [ ] Filter drawer opens/closes
- [ ] Empty state shows when no results

## 🐛 Common Issues

### "No items found"
**Solution**: Make sure you have items in database with `status = 'available'`

Run this SQL to check:
```sql
SELECT COUNT(*) FROM items WHERE status = 'available' AND deleted_at IS NULL;
```

### Images not loading
**Solution**: Check that backend serves uploads folder:

In `backend/server.js`, you should have:
```javascript
app.use('/uploads', express.static('uploads'));
```

### Distance not showing
**Solution**: 
1. Allow location access in browser
2. Make sure items have location coordinates
3. Check browser console for errors

### Save button not working
**Solution**:
1. Make sure you're logged in
2. Run the migration script
3. Check backend logs for errors

## 📸 Expected Appearance

The page should have:
- Dark background with gradient (purple/blue)
- Modern card-based layout
- Smooth animations
- Professional, clean design
- Matching your existing Campus Cart theme

## 🎉 Success!

If you can see the marketplace page with items displayed in a grid, and you can filter/search/sort them, then the feature is working perfectly!

## 🆘 Need Help?

Check the browser console (F12) and backend terminal for error messages.

Common things to verify:
1. ✅ Backend running on port 3000
2. ✅ Frontend running on port 5173
3. ✅ Database migration completed
4. ✅ Items exist in database
5. ✅ User is logged in (for save feature)

---

**Enjoy your new marketplace feature! 🎊**
