const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
  getTests,
  getVerified,
  postTest,
  deleteTest,
  updateTest,
  searchTest,
  generatereport,
} = require("../controllers/test");

// Route to verify user authentication
router.get("/verify", verifyToken, getVerified);

// Route to get all tests
router.get("/gettests", verifyToken, getTests);

// Route to post a new test
router.post("/addtest", verifyToken, postTest);

// Route to delete a test by ID
router.delete("/deletetest/:id", verifyToken, deleteTest);

// Route to update a test by ID
router.put("/updatetest/:id", verifyToken, updateTest);
router.post("/generatereport", verifyToken, generatereport);

// Route to search for tests based on a query
router.get("/search/:key", verifyToken, searchTest);

module.exports = router;
