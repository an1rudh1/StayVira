const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

// Render booking form
module.exports.renderBookingForm = async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("bookings/new.ejs", { listing });
};

// Create booking and go to payment page
module.exports.createBooking = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const { checkIn, checkOut, guests } = req.body;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
  );

  if (nights <= 0) {
    req.flash("error", "Invalid dates selected");
    return res.redirect(`/listings/${listing._id}/book`);
  }

  // Check for overlapping confirmed bookings
  const Booking = require("../models/booking.js");
  const overlapping = await Booking.findOne({
    listing: listing._id,
    status: "confirmed",
    $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
  });

  if (overlapping) {
    req.flash(
      "error",
      "These dates are already booked. Please choose different dates.",
    );
    return res.redirect(`/listings/${listing._id}/book`);
  }

  const totalPrice = nights * listing.price;

  const booking = new Booking({
    listing: listing._id,
    user: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
    totalPrice,
    nights,
    status: "pending",
  });

  await booking.save();
  res.redirect(`/bookings/${booking._id}/payment`);
};

// Render fake payment page
module.exports.renderPaymentPage = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).populate(
    "listing",
  );

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/listings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Unauthorized");
    return res.redirect("/listings");
  }

  res.render("bookings/payment.ejs", { booking });
};

// Confirm payment (dummy)
module.exports.confirmPayment = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/listings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Unauthorized");
    return res.redirect("/listings");
  }

  booking.status = "confirmed";
  await booking.save();

  req.flash("success", "Payment successful! Your booking is confirmed.");
  res.redirect(`/bookings/${booking._id}/confirmation`);
};

// Show confirmation page
module.exports.showConfirmation = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate("listing")
    .populate("user");

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/listings");
  }

  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "Unauthorized");
    return res.redirect("/listings");
  }

  res.render("bookings/show.ejs", { booking });
};

// My bookings
module.exports.myBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  res.render("bookings/index.ejs", { bookings });
};

// Cancel booking
module.exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings/my-bookings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Unauthorized");
    return res.redirect("/bookings/my-bookings");
  }

  booking.status = "cancelled";
  await booking.save();

  req.flash("success", "Booking cancelled successfully");
  res.redirect("/bookings/my-bookings");
};

// Owner dashboard
module.exports.ownerDashboard = async (req, res) => {
  // Find all listings owned by current user
  const listings = await Listing.find({ owner: req.user._id });
  const listingIds = listings.map((l) => l._id);

  // Find all bookings for those listings
  const bookings = await Booking.find({ listing: { $in: listingIds } })
    .populate("listing")
    .populate("user")
    .sort({ createdAt: -1 });

  res.render("bookings/dashboard.ejs", { bookings, listings });
};

// Update booking status (accept/reject) by owner
module.exports.updateBookingStatus = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).populate(
    "listing",
  );

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings/dashboard");
  }

  // Make sure current user is the listing owner
  if (!booking.listing.owner.equals(req.user._id)) {
    req.flash("error", "Unauthorized");
    return res.redirect("/bookings/dashboard");
  }

  booking.status = req.body.status; // "confirmed" or "cancelled"
  await booking.save();

  req.flash("success", `Booking ${req.body.status} successfully`);
  res.redirect("/bookings/dashboard");
};
