const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true }, // Will be stored as a hash
  createdAt: { type: Date, default: Date.now, expires: process.env.OTP_EXPIRY / 1000 }, // Time to live in milliseconds for THE OTP
});

otpSchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});
otpSchema.post("save", async function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Error"));
  } else {
    next(error);
  }
});
const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
