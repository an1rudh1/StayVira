const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const listingController = require("../controllers/listings.js");

// Listing Routes
//Index Route
//Create Route
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.array("image", 5),
    validateListing,
    wrapAsync(listingController.createListing),
  );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//Show Route
//Update Route
//Delete Route
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("image", 5),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditListing),
);

// Booking form
router.get(
  "/:id/book",
  isLoggedIn,
  wrapAsync(listingController.renderBookingForm),
);

// Create booking
router.post(
  "/:id/book",
  isLoggedIn,
  wrapAsync(listingController.createBooking),
);

router.get("/privacy", wrapAsync(listingController.privacy));
module.exports = router;
