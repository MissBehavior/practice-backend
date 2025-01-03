const createError = require("http-errors");
const User = require("../Models/User.model");
const { authSchema, signUpSchema } = require("../helpers/validation.schema");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");
const client = require("../helpers/init_redis");
const Otp = require("../Models/OTP.model");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_VICKY,
  },
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send OTP email
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: "Your OTP for Password Reset",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await signUpSchema.validateAsync(req.body);
      const doesExist = await User.findOne({ email: result.email });
      if (doesExist) throw createError.Conflict(`${result.email} is already registered`);
      const user = new User(result);
      const savedUser = await user.save();
      const accessToken = await signAccessToken(savedUser.name, savedUser.id, savedUser.isAdmin, savedUser.isEmployee, savedUser.email, savedUser.profileImgUrl, savedUser.profileImgPath, savedUser.telefon);
      const refreshToken = await signRefreshToken(savedUser.name, savedUser.id, savedUser.isAdmin, savedUser.isEmployee, savedUser.email, savedUser.profileImgUrl, savedUser.profileImgPath, savedUser.telefon);
      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      console.log("/login");
      const result = await authSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email });
      if (!user) throw createError.NotFound("User not registered");
      const isMatch = await user.isValidPassword(result.password);
      if (!isMatch) throw createError.Unauthorized("Username/password not valid");
      const accessToken = await signAccessToken(user.name, user.id, user.isAdmin, user.isEmployee, user.email, user.profileImgUrl, user.profileImgPath, user.telefon);
      const refreshToken = await signRefreshToken(user.name, user.id, user.isAdmin, user.isEmployee, user.email, user.profileImgUrl, user.profileImgPath, user.telefon);
      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) return next(createError.BadRequest("Invalid Username/Password"));
      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
    console.log("/refresh_token");
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const { userName, userId, userIsAdmin, userIsEmployee, userEmail, userImgUrl, userImgPath, userTelefon } = await verifyRefreshToken(refreshToken);
      const accessToken = await signAccessToken(userName, userId, userIsAdmin, userIsEmployee, userEmail, userImgUrl, userImgPath, userTelefon);
      const refToken = await signRefreshToken(userName, userId, userIsAdmin, userIsEmployee, userEmail, userImgUrl, userImgPath, userTelefon);
      res.send({ accessToken: accessToken, refreshToken: refToken });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    console.log("/logout");
    try {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) throw createError.BadRequest();
      const { userId, userIsAdmin } = await verifyRefreshToken(refreshToken);
      client.DEL(userId, (err, val) => {
        if (err) {
          console.log(err.message);
          throw createError.InternalServerError();
        }
        console.log(val);
        res.sendStatus(204);
      });
    } catch (error) {
      next(error);
    }
  },
  forgotPassword: async (req, res, next) => {
    console.log("/forgot-password");
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await Otp.deleteMany({ email });
      const otp = generateOtp();
      const hashedOtp = await bcrypt.hash(otp, 10);
      const newOtp = new Otp({ email, otp: hashedOtp });
      await newOtp.save();
      try {
        await sendOtpEmail(email, otp);
        res.status(200).json({ message: "OTP sent to your email" });
      } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Error sending OTP" });
      }
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
  verifyOtp: async (req, res, next) => {
    console.log("/verify-otp");
    const { email, otp } = req.body;
    console.log(email, otp);
    const storedOtp = await Otp.findOne({ email });
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP not requested or expired" });
    }
    const isOtpValid = await bcrypt.compare(otp, storedOtp.otp);
    console.log("-----------------------------");
    console.log(otp, storedOtp.otp, isOtpValid);
    console.log("-----------------------------");
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    await Otp.deleteOne({ email });
    res.status(200).json({ message: "OTP verified successfully. You can now reset your password." });
  },
  resetPassword: async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      // IMPORTANT STEP FOR SECURITY but we leave that here for the moment
      // Optionally, you can ensure that the OTP was verified before allowing password reset
      // This can be handled via session, token, or by ensuring the OTP was deleted after verification
      // Assuming OTP was deleted after verification, you might skip this step
      user.password = password;
      await user.save();

      res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
    }
  },
};
