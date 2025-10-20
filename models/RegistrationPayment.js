import mongoose from "mongoose";

const registrationPaymentSchema = new mongoose.Schema({
  name: String,
  category: String, // ex: Coding Competition, Project Expo, etc.
  competition: String,
  eventName: String,
  amount: Number,
  currency: String,
  orderId: String,
  paymentId: String,
  signature: String,
  status: { type: String, default: "created" },
  feePaid: Number,
  paymentTime: Date,
});

const RegistrationPayment = mongoose.model("RegistrationPayment", registrationPaymentSchema);
export default RegistrationPayment;
