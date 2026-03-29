const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const Booking = require("../models/booking.js");

// module.exports.index = async (req, res) => {
//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", { allListings });
// };

module.exports.index = async (req, res) => {
  const { location, country, minPrice, maxPrice } = req.query;

  let filter = {};

  if (location && location.trim() !== "") {
    filter.location = { $regex: location.trim(), $options: "i" };
  }

  if (country && country.trim() !== "") {
    filter.country = { $regex: country.trim(), $options: "i" };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const allListings = await Listing.find(filter);

  res.render("listings/index.ejs", {
    allListings,
    filters: { location, country, minPrice, maxPrice },
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    res.redirect("/listings");
  } else {
    res.render("listings/show.ejs", { listing });
  }
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  newListing.geometry = response.body.features[0].geometry;

  if (req.files && req.files.length > 0) {
    newListing.image = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
  } else {
    req.flash("error", "Please upload at least one image");
    return res.redirect("/listings/new");
  }

  let savedListing = await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image[0].url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.files && req.files.length > 0) {
    listing.image = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    await listing.save();
  }
  req.flash("success", "Listing got Updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing got deleted");
  res.redirect("/listings");
};

module.exports.renderBookingForm = async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const Booking = require("../models/booking.js");

  // Get all confirmed bookings for this listing
  const bookedDates = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gte: new Date() }, // only future bookings
  }).select("checkIn checkOut");

  res.render("bookings/new.ejs", { listing, bookedDates });
};

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
