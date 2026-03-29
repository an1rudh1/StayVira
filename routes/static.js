const express = require("express");
const router = express.Router();
const staticController = require("../controllers/static");

// Privacy
router.get("/privacy", staticController.renderPrivacy);

// Terms
router.get("/terms", staticController.renderTerms);

module.exports = router;
