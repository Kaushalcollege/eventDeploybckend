// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

//  Middleware
app.use(express.json());
app.use(cors());

//  Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.error(" MongoDB Connection Error:", err));

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competition: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  category: { type: String, default: "Competition" },
  fee: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Registration = mongoose.model("Registration", registrationSchema);

// -------------------------------
// ROUTES
// -------------------------------

// Health Check
app.get("/", (req, res) => {
  res.send("Welcome to Vishwasri Technologies Competition API 🚀");
});

// POST — Register a participant
app.post("/api/register", async (req, res) => {
  try {
    const { name, competition, email, mobile, category, fee } = req.body;

    // 🔍 Backend Validation
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;

    if (!name || !competition || !email || !mobile || !fee) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!nameRegex.test(name)) {
      return res
        .status(400)
        .json({ message: "Name should contain only alphabets and spaces" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!mobileRegex.test(mobile)) {
      return res
        .status(400)
        .json({ message: "Mobile number should be 10 digits" });
    }

    // 💾 Save to MongoDB
    const newRegistration = new Registration({
      name,
      competition,
      email,
      mobile,
      category,
      fee,
    });

    await newRegistration.save();

    res
      .status(201)
      .json({ message: "✅ Registration successful!", data: newRegistration });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "❌ Server error. Please try again later.",
    });
  }
});

// GET — Fetch all registrations
app.get("/api/registrations", async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.status(200).json(registrations);
  } catch (err) {
    res.status(500).json({ message: "Error fetching registrations" });
  }
});

//STALL SCHEMA 
const stallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competition: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  fee: { type: String, required: true },
  category: { type: String, default: "Stall" },
  date: { type: Date, default: Date.now },
});

const Stall = mongoose.model("Stall", stallSchema);

// Test Route
app.get("/", (req, res) => {
  res.send("✅ Stall Registration Backend Running Successfully!");
});

// POST route to register a stall
app.post("/api/stalls", async (req, res) => {
  try {
    const { name, competition, email, mobile, fee, category } = req.body;

    // Basic validations
    if (!name || !competition || !email || !mobile || !fee) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const stall = new Stall({
      name,
      competition,
      email,
      mobile,
      fee,
      category,
    });

    await stall.save();
    res.status(201).json({ message: "✅ Stall registered successfully", stall });
  } catch (error) {
    console.error("Error saving stall:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET route to fetch all stalls
app.get("/api/stalls", async (req, res) => {
  try {
    const stalls = await Stall.find();
    res.status(200).json(stalls);
  } catch (error) {
    res.status(500).json({ error: "Error fetching stalls" });
  }
});


//SPONSORSHIP SCREEN
// ------------------- SPONSORSHIP SCREEN --------------------
const sponsorshipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  competition: {
    type: String,
    required: true,
  },
  contactName: { // ✅ corrected field name
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/, // Basic email validation
  },
  mobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/, // Only digits (10-digit mobile number)
  },
  terms: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Sponsorship = mongoose.model("Sponsorship", sponsorshipSchema);

// -------------------- API ROUTES --------------------

//  Register Sponsorship
app.post("/api/sponsorship/register", async (req, res) => {
  try {
    console.log(" Incoming Sponsorship Data:", req.body);

    // Destructure correctly (case-sensitive)
    const { name, competition, contactName, email, mobile, terms } = req.body;

    // Validation
    if (!name || !competition || !contactName || !email || !mobile || terms !== true) {
      return res.status(400).json({
        message: "All fields are required and Terms must be accepted.",
      });
    }

    const newSponsorship = new Sponsorship({
      name,
      competition,
      contactName, //  corrected
      email,
      mobile,
      terms,
    });

    await newSponsorship.save();
    console.log(" Sponsorship registration saved successfully!");
    res
      .status(201)
      .json({ message: "Sponsorship registration successful!" });
  } catch (error) {
    console.error(" Error registering sponsorship:", error.message);
    res
      .status(500)
      .json({ message: "Server error while registering sponsorship.", error: error.message });
  }
});

//  Get All Sponsorships
app.get("/api/sponsorship", async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find();
    res.status(200).json(sponsorships);
  } catch (error) {
    console.error(" Error fetching sponsorships:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching sponsorships." });
  }
});

//  Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
