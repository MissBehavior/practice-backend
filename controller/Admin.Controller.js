const createError = require("http-errors");
const User = require("../Models/User.model");
const { authSchema, signUpSchema } = require("../helpers/validation.schema");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");
const client = require("../helpers/init_redis");

module.exports = {
  getUsers: async (req, res, next) => {
    console.log("/getUser");
    const total = await User.countDocuments();
    console.log(total);
    try {
      const allUsers = await User.find();
      console.log("ALL USERS");
      console.log(allUsers);
      res.json({
        allUsers,
      });
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
  getUserById: async (req, res, next) => {
    try {
      const id = req.params.id;
      const user = await User.findById(id);
      if (!user) throw createError.NotFound("User not found");
      res.send(user);
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
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
  //   deleteUser: async (req, res, next) => {
  //     try {

  //         res.sendStatus(204);

  //     } catch (error) {
  //       next(error);
  //     }
  //   },
};
