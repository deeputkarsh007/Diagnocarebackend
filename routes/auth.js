const express = require("express");
const router = express.Router();
const jwtKey = process.env.db_url;
const Jwt = require("jsonwebtoken");
const user = require("../db/user");
const hehe = { this: "nothinf" };
const bcrypt = require("bcrypt"); // Ensure this is set in your environment variables

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // Check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user by email
    const existingUser = await user.findOne({ email });

    // Check if user exists
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User exist");

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = Jwt.sign({ _id: existingUser._id }, jwtKey, {
      expiresIn: "4h",
    });
    // console.log(token);

    // Remove password field from the user object
    const { password: _, ...userData } = existingUser.toObject();

    // Send response with token and user data
    res.status(200).json({ token, user: userData });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  console.log("Signup request received:", req.body);

  try {
    // Check if email already exists
    const existingUser = await user.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user object
    const newUser = new user({
      email: req.body.email,
      password: hashedPassword,
    });

    // Save the new user
    const savedUser = await newUser.save();

    // Generate JWT token
    const token = Jwt.sign({ _id: savedUser._id }, jwtKey, { expiresIn: "4h" });

    // Exclude password from response
    const { password, ...userData } = savedUser.toObject();

    res.status(201).json({ token, user: userData });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
