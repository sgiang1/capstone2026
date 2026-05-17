# Coding Instructions

## Tech Stack
- ReactJS (client)
- Firebase Authentication
- Firebase Firestore
- Vite (build tool / dev server)

## How to Run the Code
All commands are run from the root directory (`capstone2026`).

1. Install dependencies: `npm install`
2. Create a `.env` file in the root directory with your Firebase credentials (see Back-End section for required variable names)
3. Start the development server: `npm run dev`

The app will open at `http://localhost:5173`

## Client Folder Structure

The `src/` folder contains all source code.

### pages/
Each page has a matching `.jsx` and `.css` file at the top level of `src/`:

- `home.jsx` — landing page with hero search bar, quick accessibility filter chips, and a popular venues grid
- `explore.jsx` — full venue search and browse page with a sidebar filter panel and sort controls
- `filter.jsx` — dedicated full-screen page for selecting accessibility filters
- `venue.jsx` — individual venue detail page showing aggregated accessibility data, category ratings, and community reviews
- `fullreview.jsx` — full detail view of a single review including all advanced sections and photos
- `profile.jsx` — authenticated user profile showing editable info, saved venues, and the user's submitted reviews
- `signin.jsx` / `signup.jsx` — email/password authentication pages

`App.jsx` defines all routes. `main.jsx` is the app entry point.

### components/
Shared UI pieces used across multiple pages:

- `Header.jsx`, `Footer.jsx`,
- `VenueCard.jsx` — reusable venue cards
- `ReviewForm.jsx` — accessibility review form structure

### db/
All Firestore access functions organized by data type: `venues.js`, `reviews.js`, `users.js`, `saved.js`.  
Import from `index.js` which re-exports everything so pages can pull from a single location.

### data/
Static config files:

- `access-filters.txt` — defines all filter categories and tags, read at runtime to build the filter UI
- `reviewFormData.js` — defines the advanced review sections (e.g. Parking, Bathrooms, Staff) used in the review form and venue page

### utils/
- `filterStorage.js` — saves selected filters to `localStorage` so they persist across pages

### Styles
Styles follow the same per-page split as the `.jsx` files. Shared global styles live in `styles/ui.css`.

## Front-End
Built with React + Vite. React Router DOM handles all client-side routing. Routes are defined in `App.jsx`:

| Path | Description |
|---|---|
| `/` | Landing page with search bar, quick filter chips, and popular venues |
| `/explore` | Full venue listing with search, sort, and sidebar accessibility filters |
| `/explore/filter` | Full filter tag page for selecting from all accessibility filter categories |
| `/venues/:venueId` | Venue accessibility overview, category ratings, and community reviews |
| `/venues/:venueId/review` | Opens the review form for the particular venueId |
| `/venues/:venueId/reviews/:reviewId` | Expanded single review with advanced section ratings, tags, and photos |
| `/profile` | Editable user profile, saved venues, and submitted reviews |
| `/signin` / `/signup` | Sign in or register with email and password |

The filter system is driven by `access-filters.txt`. Selected filters are shared across all pages via localStorage.

## Back-End
No custom server — all back-end functionality is handled by Firebase directly from the browser. 
`src/firebase.js` initializes Firebase using `.env` variables and exports `db` (Firestore) and `auth` (Firebase Auth) used throughout the app.

### Required `.env` Variables
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Firestore Collections

| Collection | Description |
|---|---|
| `venues` | Name, address, image URL, access tags, search tags, and aggregate rating/review count |
| `reviews` | Linked to a user and venue; stores overall rating, summary, visit date, access needs, photos, advanced section ratings, and upvote/downvote counts |
| `users` | Profile info keyed by Firebase Auth UID; includes name, email, accessibility preferences, and an `isAdmin` boolean that gates venue write access |

Venue ratings (`rating`, `reviewCount`) are updated atomically via Firestore transactions whenever a review is added or deleted.
