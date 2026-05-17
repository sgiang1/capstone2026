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

The `src/` folder contains all source code. Each page has a matching `.jsx` and `.css` file at the top level of `src/`.

### Pages
- `home.jsx` — landing page with search bar, filter chips, and popular venues grid
- `explore.jsx` — venue browsing with sidebar filters and sort controls
- `filter.jsx` — full-screen accessibility filter selection
- `venue.jsx` — venue detail with accessibility overview, category ratings, and reviews
- `fullreview.jsx` — full single review detail including advanced sections and photos
- `profile.jsx` — editable user profile, saved venues, and submitted reviews
- `signin.jsx` / `signup.jsx` — email/password authentication

`App.jsx` defines all routes. `main.jsx` is the app entry point.

### Other Folders
- `components/` — `Header.jsx`, `Footer.jsx`, `VenueCard.jsx`, `ReviewForm.jsx`
- `db/` — DB functions split by type: `venues.js`, `reviews.js`, `users.js`, `saved.js`. Import from `index.js`
- `data/` — `access-filters.txt` builds the filter UI at runtime; `reviewFormData.js` defines advanced review sections
- `utils/filterStorage.js` — persists selected filters to `localStorage` across pages

Styles follow a per-page `.css` split alongside each `.jsx`. Shared global styles live in `styles/ui.css`.

## Front-End

Built with React + Vite. React Router DOM handles all client-side routing. The app has the following routes:

`/` — Landing page with search bar, quick filter chips, and popular venues

`/explore` — Full venue listing with search, sort, and sidebar accessibility filters

`/explore/filter` — Full filter tag page for selecting from all accessibility filter categories

`/venues/:venueId` — Venue accessibility overview, category ratings, and community reviews

`/venues/:venueId/review` — Opens the review form for the particular venueId

`/venues/:venueId/reviews/:reviewId` — Expanded single review with advanced section ratings, tags, and photos

`/profile` — Editable user profile, saved venues, and submitted reviews

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
