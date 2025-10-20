import mongoose from "mongoose";

const ticketPaymentSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  name: String,
  type: String, // ex: VIP, Regular, Early Bird
  eventName: String,
  amount: Number,
  currency: String,
  contact: String, // ✅ new field for email/phone
  orderId: String,
  paymentId: String,
  signature: String,
  status: { type: String, default: "created" },
  paymentTime: Date,
});

const TicketPayment = mongoose.model("TicketPayment", ticketPaymentSchema);
export default TicketPayment;
