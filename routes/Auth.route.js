const express = require("express");
const router = express.Router();
const AuthController = require("../controller/Auth.Controller");
const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: "Too many OTP requests, please try again later.",
});

router.post("/register", AuthController.register);

router.post("/login", AuthController.login);
router.post("/refresh_token", AuthController.refreshToken);
router.delete("/logout", AuthController.logout);

router.post("/forgot-password", otpLimiter, AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOtp);

module.exports = router;
