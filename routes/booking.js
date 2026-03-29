const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

// My bookings
router.get("/my-bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

// Booking confirmation page
router.get(
  "/:bookingId/confirmation",
  isLoggedIn,
  wrapAsync(bookingController.showConfirmation),
);

// Payment page
router.get(
  "/:bookingId/payment",
  isLoggedIn,
  wrapAsync(bookingController.renderPaymentPage),
);

// Confirm payment
router.post(
  "/:bookingId/pay",
  isLoggedIn,
  wrapAsync(bookingController.confirmPayment),
);

// Cancel booking
router.post(
  "/:bookingId/cancel",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking),
);

// Owner dashboard
router.get(
  "/dashboard",
  isLoggedIn,
  wrapAsync(bookingController.ownerDashboard),
);

// Update booking status
router.post(
  "/:bookingId/status",
  isLoggedIn,
  wrapAsync(bookingController.updateBookingStatus),
);

module.exports = router;
