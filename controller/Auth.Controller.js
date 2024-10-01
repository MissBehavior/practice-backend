const createError = require("http-errors");
const User = require("../Models/User.model");
const { authSchema, signUpSchema } = require("../helpers/validation.schema");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");
const client = require("../helpers/init_redis");
const Otp = require("../Models/OTP.model");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// const transporter = nodemailer.createTransport({
//   service: 'gmail', // or any other email service
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });
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
    console.log("/register");
    console.log(req.body);
    console.log(req.body.name);
    console.log(req.body.email);
    console.log(req.body.password);
    try {
      // const [email, password, name] = [req.body.email, req.body.password, req.body.name];
      const result = await signUpSchema.validateAsync(req.body);
      console.log(result);
      console.log("after validate");
      // if (!email || !password || !name) {
      //   throw createError.BadRequest();
      // }
      const doesExist = await User.findOne({ email: result.email });
      console.log("/register");
      console.log(doesExist);
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
      console.log("test1");
      const user = await User.findOne({ email: result.email });
      console.log(user);
      if (!user) throw createError.NotFound("User not registered");
      console.log("test3");
      const isMatch = await user.isValidPassword(result.password);
      console.log("test4");
      // console.log(isMatch);
      if (!isMatch) throw createError.Unauthorized("Username/password not valid");
      console.log("test5");
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
      // console.log("--------------------------------------------");
      // console.log(userName, userId, userIsAdmin, userIsEmployee, userEmail, userImgUrl, userImgPath, userTelefon);
      // console.log("--------------------------------------------");
      const accessToken = await signAccessToken(userName, userId, userIsAdmin, userIsEmployee, userEmail, userImgUrl, userImgPath, userTelefon);
      const refToken = await signRefreshToken(userName, userId, userIsAdmin, userIsEmployee, userEmail, userImgUrl, userImgPath, userTelefon);
      // console.log("/refresh_token before send");
      // console.table({ refreshToken, userId, accessToken, refToken });
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10); // Hash the OTP before storing it
    const newOtp = new Otp({ email, otp: hashedOtp });
    await newOtp.save();
    try {
      await sendOtpEmail(email, otp);
      res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Error sending OTP" });
    }
  },
  verifyOtp: async (req, res, next) => {
    const { email, otp } = req.body;
    const storedOtp = await Otp.findOne({ email });
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP not requested or expired" });
    }
    const isOtpValid = await bcrypt.compare(otp, storedOtp.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    await Otp.deleteOne({ email }); // Remove OTP after successful verification
    res.status(200).json({ message: "OTP verified successfully. You can now reset your password." });
  },
};
