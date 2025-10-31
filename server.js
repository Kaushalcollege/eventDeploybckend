import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import RegistrationPayment from "./models/RegistrationPayment.js";
import TicketPayment from "./models/TicketPayment.js";

dotenv.config();

const app = express();

//  Middleware
app.use(express.json());
app.use(cors());

//  Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.error(" MongoDB Connection Error:", err));

const registrationSchema = new mongoose.Schema({
  registrationId: { type: String, unique: true },
  name: { type: String, required: true },
  competition: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  category: { type: String, default: "Competition" },
  fee: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Registration = mongoose.model("Competition", registrationSchema);

// Health Check
app.get("/", (req, res) => {
  res.send("Welcome to Vishwasri Technologies Competition API 🚀");
});

// POST — Register a participant
// Generate unique registration ID
function generateRegistrationId() {
  return "REG" + Math.floor(100000 + Math.random() * 900000);
}
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

    // Generate a new registration ID
    let registrationId = generateRegistrationId();

    // Check for duplicates (rare, but good practice)
    let exists = await Registration.findOne({ registrationId });
    while (exists) {
      registrationId = generateRegistrationId();
      exists = await Registration.findOne({ registrationId });
    }

    const newRegistration = new Registration({
      registrationId,
      name,
      competition,
      email,
      mobile,
      category,
      fee,
    });
    await newRegistration.save();
    res.status(201).json({
      message: "Registration successful!",
      registrationId,
      data: newRegistration,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "Server error. Please try again later.",
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

app.get("/api/registration/:input", async (req, res) => {
  try {
    const { input } = req.params;

    const registration = await Registration.findOne({
      $or: [{ email: input }, { mobile: input }],
    });

    if (!registration) {
      return res.status(404).json({ message: "No registration found" });
    }

    res.status(200).json(registration);
  } catch (err) {
    console.error("Error fetching registration:", err);
    res.status(500).json({ message: "Server error" });
  }
});
//STALL SCHEMA
const stallSchema = new mongoose.Schema({
  stallId: { type: String, unique: true },
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
  res.send("Stall Registration Backend Running Successfully!");
});

// POST route to register a stall
// ✅ Function to generate unique Stall ID
function generateStallId() {
  return "STALL" + Math.floor(100000 + Math.random() * 900000);
}

app.post("/api/stalls", async (req, res) => {
  try {
    const { name, competition, email, mobile, fee, category } = req.body;

    // Basic validations
    if (!name || !competition || !email || !mobile || !fee) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Generate unique Stall ID
    let stallId = generateStallId();
    let exists = await Stall.findOne({ stallId });

    // Re-generate if duplicate (rare case)
    while (exists) {
      stallId = generateStallId();
      exists = await Stall.findOne({ stallId });
    }

    const stall = new Stall({
      stallId,
      name,
      competition,
      email,
      mobile,
      fee,
      category,
    });

    await stall.save();
    res
      .status(201)
      .json({ message: "Stall registered successfully", stallId, stall });
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

app.get("/api/stalls/:input", async (req, res) => {
  try {
    const { input } = req.params;

    const stall = await Stall.findOne({
      $or: [{ email: input }, { mobile: input }],
    });

    if (!stall) {
      return res.status(404).json({ message: "No stall registration found" });
    }

    res.status(200).json(stall);
  } catch (err) {
    console.error("Error fetching stall:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//  Sponsorship Schema & Model
const sponsorshipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competition: { type: String, required: true }, // Sponsorship Tier (e.g. Bronze, Gold)
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  category: { type: String, default: "Sponsorship" },
  createdAt: { type: Date, default: Date.now },
});

const Sponsorship = mongoose.model("Sponsorship", sponsorshipSchema);

// Health Check
app.get("/", (req, res) => {
  res.send("Vishwasri Sponsorship API is Running 🚀");
});

// POST — Register Sponsorship
app.post("/api/sponsorship", async (req, res) => {
  try {
    const { name, competition, email, mobile } = req.body;

    // 🔍 Backend Validations
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;

    if (!name || !competition || !email || !mobile) {
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
        .json({ message: "Mobile number must be 10 digits" });
    }

    // 💾 Save to MongoDB
    const newSponsor = new Sponsorship({
      name,
      competition,
      email,
      mobile,
      category: "Sponsorship",
    });

    await newSponsor.save();

    res.status(201).json({
      message:
        "Thank you for your interest in sponsoring Vishwasri TechFest 2025! Our team will contact you shortly.",
      data: newSponsor,
    });
  } catch (error) {
    console.error("Error saving sponsorship:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// GET — Fetch All Sponsorship Entries
app.get("/api/sponsorships", async (req, res) => {
  try {
    const sponsors = await Sponsorship.find().sort({ createdAt: -1 });
    res.status(200).json(sponsors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sponsorships" });
  }
});

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

// POST - Add contact enquiry
app.post("/api/contact", async (req, res) => {
  try {
    const { name, mobile, email, message } = req.body;
    const newContact = new Contact({ name, mobile, email, message });
    await newContact.save();
    res.status(201).json({ message: "Contact form submitted successfully!" });
  } catch (err) {
    console.error("Error saving contact:", err);
    res.status(500).json({ message: "Error submitting form" });
  }
});

// GET - Fetch all contacts (admin view)
app.get("/api/contact", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ submittedAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ message: "Error fetching contacts" });
  }
});

//Razorpay Integration
// 🔑 Replace with your Razorpay test keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create order API
app.post("/api/create-order", async (req, res) => {
  try {
    const {
      amount,
      name,
      category,
      competition,
      eventName,
      type,
      paymentFor,
      contact,
    } = req.body; // amount in INR

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 💾 Save order in correct collection
    if (paymentFor === "ticket") {
      // Ticket purchase

      try {
        // Find any old, "created" (incomplete) payments for this user
        const oldFailedPayment = await TicketPayment.findOne({
          contact: contact,
          status: "created",
        });

        // If one exists, delete it to prevent a duplicate key error
        if (oldFailedPayment) {
          console.log("Removing old failed payment:", oldFailedPayment.orderId);
          await TicketPayment.deleteOne({ _id: oldFailedPayment._id });
        }
      } catch (dbError) {
        console.error("Error cleaning up old payments:", dbError);
        // Don't stop the transaction, just log the error
      }

      const ticketId = await generateTicketId(); // ⬅️ MOVED HERE
      const newTicketPayment = new TicketPayment({
        orderId: order.id,
        ticketId: ticketId, // ⬅️ ADDED HERE
        amount: order.amount / 100,
        currency: order.currency,
        status: order.status, // This will be 'created'
        contact,
        name,
        type,
        eventName,
      });
      await newTicketPayment.save();
      console.log(
        "Ticket order created:",
        order.id,
        "with TicketID:",
        ticketId
      );
    } else {
      // Registration payment
      const newRegPayment = new RegistrationPayment({
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        status: order.status,
        name,
        category,
        competition,
        eventName,
        feePaid: amount,
      });
      await newRegPayment.save();
      console.log("Registration order created:", order.id);
    }

    res.json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// 🧠 Helper function to generate unique ticket ID
const generateTicketId = async () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const ticketId = `TICK${randomNum}`;
  const exists = await TicketPayment.findOne({ ticketId });
  if (exists) return generateTicketId(); // retry if duplicate
  return ticketId;
};

// ✅ Verify Payment API
app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentFor,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    const isAuthentic = razorpay_signature === expectedSign;

    if (!isAuthentic) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // ✅ Update correct collection
    const updateData = {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: "paid",
      paymentTime: new Date(),
    };

    if (paymentFor === "ticket") {
      // 🎟️ Find the ticket, update it, and get the new version
      const updatedTicket = await TicketPayment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        updateData,
        { new: true } // ⬅️ ADDED: This returns the updated document
      );

      // ⬅️ ADDED: Good practice to check if the ticket was found
      if (!updatedTicket) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      console.log("Ticket payment verified:", razorpay_payment_id);
      return res.json({
        success: true,
        message: "Ticket payment verified successfully",
        ticketId: updatedTicket.ticketId, // ⬅️ CHANGED: Get ID from the found doc
      });
    } else {
      await RegistrationPayment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        updateData
      );
      console.log("📝 Registration payment verified:", razorpay_payment_id);
    }

    res.json({
      success: true,
      message: "Registration payment verified successfully",
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ✅ Get Ticket by Email or Phone
app.get("/api/ticket/:input", async (req, res) => {
  try {
    const { input } = req.params;

    // Search by email or contact number
    const ticket = await TicketPayment.findOne({
      $or: [{ contact: input }, { name: input }],
    });

    if (!ticket) {
      return res
        .status(404)
        .json({ message: "No ticket found for this email or phone number" });
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error("Error fetching ticket:", err);
    res.status(500).json({ message: "Server error while fetching ticket" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
