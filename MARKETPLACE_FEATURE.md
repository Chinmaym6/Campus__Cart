# Marketplace Browse Feature - Implementation Guide

## 🎉 Feature Overview

A comprehensive marketplace browsing system with advanced filtering, smart search, and modern UI.

## ✨ Features Implemented

### 📱 Frontend Features

1. **Marketplace Browse Page** (`/marketplace` or `/browse`)
   - Responsive grid layout (3 columns desktop, 2 tablet, 1 mobile)
   - Beautiful gradient design matching your existing pages
   - Sticky header with search bar
   - Real-time filter updates

2. **Smart Search Bar**
   - Auto-complete suggestions (debounced 300ms)
   - Recent searches (saved in localStorage)
   - Category suggestions
   - Item title suggestions
   - Search on submit with Enter key

3. **Advanced Filter System**
   - **Filter Drawer** (slides from right on desktop, bottom on mobile)
   - **Quick Filters** (always visible):
     - Category dropdown
     - Condition dropdown
     - Sort dropdown
   - **Advanced Filters** (in drawer):
     - Price range (min/max inputs)
     - Distance radius (1, 5, 10, 25, 50 miles)
     - Transaction type (All, Cash, Digital, Trade)
     - Date posted (All Time, Last 24 Hours, This Week, This Month)
   - Active filter count badge
   - Clear all filters button
   - Filters persist in URL for sharing

4. **Sorting Options**
   - Newest First
   - Lowest Price
   - Highest Price
   - Nearest First (when location available)
   - Most Popular (based on views + saves)

5. **Item Cards**
   - Image display with fallback
   - Save/favorite button (heart icon)
   - Condition badge
   - Price (prominent gradient)
   - Distance from user (if location available)
   - View count and save count
   - Seller info with avatar
   - Time ago (smart formatting)
   - Hover effect (lift card with glow)

6. **Empty States & Loading**
   - Skeleton loading cards (12 placeholders)
   - Empty state with clear filters button
   - Loading states for search

7. **Pagination**
   - Smart pagination with ellipsis
   - Previous/Next buttons
   - Direct page number buttons
   - Shows current page

8. **Geolocation**
   - Requests user location on load
   - Calculates distance to items
   - Enables "Nearest First" sort option
   - Respects user denial gracefully

### 🔧 Backend Features

1. **Browse API** (`GET /api/items/browse`)
   - Complex filtering with dynamic query building
   - Search in title and description (case-insensitive)
   - Category filtering
   - Price range filtering
   - Condition filtering (multiple)
   - Transaction type filtering (cash/digital/trade)
   - Date posted filtering
   - Distance-based filtering with PostGIS
   - Sorting (newest, price, distance, popularity)
   - Pagination (24 items per page)
   - Returns total count and page info

2. **Search Suggestions API** (`GET /api/items/search-suggestions`)
   - Returns matching item titles
   - Returns matching categories
   - Minimum 2 characters required
   - Limited to 5 items + 3 categories

3. **View Tracking** (`POST /api/items/:id/view`)
   - Increments view counter
   - No authentication required

4. **Save/Unsave Items** (`POST /api/items/:id/save`)
   - Toggle save status
   - Updates save_count
   - Requires authentication
   - Uses saved_items table

5. **Database**
   - New `saved_items` table with indexes
   - Efficient PostGIS distance queries
   - Proper JOIN with users and categories

## 📁 Files Created

### Frontend
- `frontend/src/pages/Marketplace.jsx` - Main marketplace component
- `frontend/src/pages/Marketplace.css` - Comprehensive styling

### Backend
- `backend/config/add-saved-items.sql` - Database migration
- `backend/run-saved-items-migration.js` - Migration runner

### Files Modified
- `frontend/src/App.jsx` - Added marketplace routes
- `frontend/src/pages/Dashboard.jsx` - Enabled Browse Items button
- `frontend/src/components/Navbar.jsx` - Added Browse link
- `backend/routes/items.js` - Added browse, search, save APIs

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
cd backend
node run-saved-items-migration.js
```

This creates the `saved_items` table with proper indexes.

### 2. Start Backend Server

```bash
cd backend
npm start
```

The backend should be running on `http://localhost:3000`

### 3. Start Frontend Server

```bash
cd frontend
npm run dev
```

The frontend should be running on `http://localhost:5173`

### 4. Test the Feature

1. Navigate to `http://localhost:5173`
2. Log in to your account
3. Click "Browse Items" on Dashboard or "Browse" in navbar
4. You should see the marketplace page!

## 🎨 Design Highlights

1. **Consistent Theme**: Matches your existing dark gradient theme with purple/blue accents
2. **Smooth Animations**: All interactions have smooth transitions
3. **Responsive Design**: Works perfectly on mobile, tablet, and desktop
4. **Modern UI Patterns**: 
   - Floating filter drawer
   - Skeleton loading states
   - Smart pagination
   - Interactive hover effects
5. **Accessibility**: Clear visual feedback, proper focus states

## 📊 Filter URL Parameters

Filters are persisted in URL for easy sharing:

```
/marketplace?search=laptop&category=electronics&min_price=100&max_price=500&condition=like_new&sort=price_low
```

Parameters:
- `search` - Search query
- `category` - Category ID
- `min_price` - Minimum price
- `max_price` - Maximum price
- `condition` - Item condition
- `transaction_type` - Payment type (cash/digital/trade)
- `date_posted` - Time filter (today/week/month)
- `distance` - Distance radius in miles
- `sort` - Sort order (newest/price_low/price_high/nearest/popular)

## 🔍 How Search Works

1. User types in search box
2. After 300ms delay (debounce), suggestions API is called
3. Suggestions show:
   - Recent searches (from localStorage)
   - Matching categories
   - Matching item titles
4. User can click suggestion or press Enter
5. Search query is saved to recent searches
6. Items are fetched with search filter

## 📍 How Distance Filtering Works

1. Page loads and requests geolocation permission
2. If granted, user's lat/lng is stored in state
3. Distance filter becomes available
4. Browse API uses PostGIS `ST_DWithin` for efficient spatial queries
5. Distance is calculated in miles and displayed on cards

## 💾 How Save/Favorite Works

1. User clicks heart icon (requires login)
2. API checks if item is already saved
3. If saved: removes from saved_items, decrements save_count
4. If not saved: adds to saved_items, increments save_count
5. Item list refreshes to show updated save count

## 🎯 Performance Optimizations

1. **Debounced Search**: 300ms delay prevents excessive API calls
2. **Pagination**: Only 24 items loaded at a time
3. **Indexed Queries**: All filter fields have proper indexes
4. **Lazy Loading**: Images load as needed
5. **React State Management**: Efficient re-renders
6. **PostGIS Spatial Indexes**: Fast distance calculations

## 🐛 Troubleshooting

### No items showing up
- Make sure you have items with `status = 'available'` in database
- Check browser console for errors
- Verify backend is running on port 3000

### Distance not working
- Check if browser location permission is granted
- Verify items have valid location coordinates
- Check browser console for geolocation errors

### Images not loading
- Verify `uploads/listings/` directory exists
- Check that items have `primary_photo_url` or `photos` data
- Ensure backend serves static files from uploads folder

### Filters not working
- Check browser console for API errors
- Verify URL parameters are being set
- Check backend logs for query errors

## 🔮 Future Enhancements

1. **Image Carousel**: Swipe through multiple photos
2. **Video Support**: Show video badge and play videos
3. **Seller Ratings**: Display star ratings
4. **Verified Badge**: Show verified seller badge
5. **Infinite Scroll**: Load more on scroll instead of pagination
6. **Map View**: Show items on interactive map
7. **Compare Items**: Select and compare multiple items
8. **Share Items**: Social media sharing
9. **Report Item**: Flag inappropriate listings
10. **Saved Searches**: Save filter combinations

## 🎓 Learning Resources

- React Hooks: https://react.dev/reference/react
- PostGIS: https://postgis.net/documentation/
- CSS Grid: https://css-tricks.com/snippets/css/complete-guide-grid/
- Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

## 🙌 Credits

Built for Campus Cart - A modern college marketplace platform.
