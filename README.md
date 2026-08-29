# Stayvira

A full-stack rental listing and booking platform, inspired by Airbnb, built with a classic server-rendered Node.js/Express architecture. Users can list properties, browse and search listings by location, book stays, leave reviews, and pay securely online.

## Features

- **User Authentication** — Secure sign-up/login using Passport.js (`passport-local-mongoose`), with session persistence via MongoDB
- **Property Listings** — Create, edit, and delete listings with images, pricing, descriptions, and location data
- **Image Uploads** — Listing photos uploaded and stored via Cloudinary, handled through Multer
- **Interactive Maps** — Listings are geocoded and displayed with location markers using the Mapbox SDK
- **Bookings** — Users can book listings for a date range and guest count, with automatic price and duration calculation and status tracking (pending / confirmed / cancelled)
- **Online Payments** — Integrated Razorpay for secure payment processing on bookings
- **Reviews & Ratings** — Users can leave reviews on listings, with reviews automatically cleaned up when a listing is deleted
- **Flash Messages** — Real-time success/error feedback using `connect-flash`
- **Server-Side Validation** — Request payloads validated with Joi schemas before hitting the database

## Tech Stack

| Layer          | Technology                                              |
|----------------|----------------------------------------------------------|
| Backend        | Node.js, Express 5                                       |
| Templating     | EJS + EJS-Mate (layouts)                                 |
| Database       | MongoDB Atlas, Mongoose 9                                |
| Authentication | Passport.js (`passport-local`, `passport-local-mongoose`)|
| File Storage   | Multer + Cloudinary                                      |
| Maps/Geocoding | Mapbox SDK                                                |
| Payments       | Razorpay                                                  |
| Validation     | Joi                                                       |
| Sessions       | `express-session` + `connect-mongo`                       |

## Project Structure

```
MAJORPROJECT/
├── controllers/       # Route handler logic (listings, bookings, reviews, users, static)
├── models/            # Mongoose schemas (Listing, Booking, Review, User)
├── routes/            # Express routers, one per resource
├── views/             # EJS templates (listings, bookings, users, includes, layouts)
├── public/            # Static assets (CSS, JS)
├── utils/             # Error handling helpers (ExpressError, wrapAsync)
├── init/              # Database seed script and sample data
├── cloudConfig.js     # Cloudinary configuration
├── schema.js          # Joi validation schemas
├── middleware.js       # Auth/ownership middleware
└── app.js             # App entry point
```

## Data Models

- **Listing** — title, description, images, price, location, country, geometry (GeoJSON coordinates for map display), owner reference, associated reviews
- **Booking** — references a listing and a user, check-in/check-out dates, guest count (1–10), total price, number of nights, and status
- **Review** — linked to a listing; automatically removed when its parent listing is deleted
- **User** — email-based authentication via `passport-local-mongoose`

## Getting Started

### Prerequisites
- Node.js
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account
- Mapbox account
- Razorpay account

### Installation

```bash
git clone <repo-url>
cd MAJORPROJECT
npm install
```

### Environment Variables

Create a `.env` file in the root directory with:

```
ATLASDB_URL=<your MongoDB Atlas connection string>
CLOUD_NAME=<your Cloudinary cloud name>
CLOUD_API_KEY=<your Cloudinary API key>
CLOUD_API_SECRET=<your Cloudinary API secret>
MAP_TOKEN=<your Mapbox access token>
RAZORPAY_KEY_ID=<your Razorpay key id>
RAZORPAY_KEY_SECRET=<your Razorpay key secret>
SECRET=<session secret>
```

### Run the app

```bash
node app.js
```

The app will be available at `http://localhost:8080` (or the configured port).

## License

ISC
