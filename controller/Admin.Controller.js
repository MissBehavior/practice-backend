const createError = require("http-errors");
const User = require("../Models/User.model");
const Gallery = require("../Models/Gallery.model");
const { authSchema, signUpSchema } = require("../helpers/validation.schema");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");
const client = require("../helpers/init_redis");

module.exports = {
  getUsers: async (req, res, next) => {
    console.log("/getUser");
    const total = await User.countDocuments();
    console.log(total);
    try {
      const allUsers = await User.find().select("-password");
      res.json({
        allUsers,
      });
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
  createUser: async (req, res, next) => {
    try {
      const { name, email, telefon, isAdmin, isEmployee } = req.body;
      const newUser = new User({ name, email, telefon, isAdmin, isEmployee, password: "password" });
      const savedUser = await newUser.save();
      const userWithoutPassword = await User.findById(savedUser._id).select("-password");
      res.json(userWithoutPassword);
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id || id.length !== 24) throw createError.BadRequest("Please provide a valid user id");

      const { name, email, telefon, isAdmin, isEmployee } = req.body;

      const updatedUser = await User.findByIdAndUpdate(id, { name, email, telefon, isAdmin, isEmployee }, { new: true }).select("-password");

      if (!updatedUser) throw createError.NotFound("User not found");

      res.json(updatedUser);
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },

  getUserCount: async (req, res, next) => {
    console.log("/getUserCount");
    try {
      const total = await User.countDocuments();
      res.json({
        total,
      });
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
  getGalleryCount: async (req, res, next) => {
    console.log("/getGalleryCount");
    try {
      const total = await Gallery.countDocuments();
      res.json({
        total,
      });
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
  getUserById: async (req, res, next) => {
    console.log("getUserById");
    try {
      const id = req.params.id;
      if (!id || id.length !== 24) throw createError.BadRequest("Please provide a valid user id");
      const user = await User.findById(id);
      if (!user) throw createError.NotFound("User not found");
      res.send(user);
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
  getUsersByYear: async (req, res, next) => {
    const year = parseInt(req.params.year);
    if (!year || req.params.year.length !== 4) {
      return res.status(400).send("Invalid year format.");
    }
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    try {
      const users = await User.find({
        createdAt: { $gte: startDate, $lte: endDate },
      }).select("-password");
      if (!users) throw createError.NotFound("Users not found");

      res.json(users);
    } catch (error) {
      res.status(500).send("Error fetching users.");
    }
  },
  //   createUser: async (req, res, next) => {
  //     console.log("/refresh_token");
  //     try {

  //       res.send({ accessToken: accessToken, refreshToken: refToken });
  //     } catch (error) {
  //       next(error);
  //     }
  //   },
  //   updateUser: async (req, res, next) => {
  //     try {

  //         res.sendStatus(204);

  //     } catch (error) {
  //       next(error);
  //     }
  //   },
  deleteUser: async (req, res, next) => {
    try {
      console.log("deleteUser CALLED ");
      const { id } = req.params;
      console.log(id);
      if (!id || id.length !== 24) throw createError.BadRequest("Please provide a valid user id");
      const user = await User.findById(id);
      if (!user) throw createError.NotFound("User not found");
      const deletedUser = await User.findByIdAndDelete(id);
      res.send(deletedUser);
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
};
