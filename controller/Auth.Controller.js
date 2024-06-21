const createError = require("http-errors");
const User = require("../Models/User.model");
const { authSchema, signUpSchema } = require("../helpers/validation.schema");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");
const client = require("../helpers/init_redis");

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
      const accessToken = await signAccessToken(savedUser.name, savedUser.id, savedUser.isAdmin);
      const refreshToken = await signRefreshToken(savedUser.name, savedUser.id, savedUser.isAdmin);
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
      // console.log(isMatch);
      if (!isMatch) throw createError.Unauthorized("Username/password not valid");
      const accessToken = await signAccessToken(user.name, user.id, user.isAdmin);
      const refreshToken = await signRefreshToken(user.name, user.id, user.isAdmin);
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
      const { userName, userId, userIsAdmin } = await verifyRefreshToken(refreshToken);
      const accessToken = await signAccessToken(userName, userId, userIsAdmin);
      const refToken = await signRefreshToken(userName, userId, userIsAdmin);
      // console.log("/refresh_token before send");
      // console.table({ refreshToken, userId, accessToken, refToken });
      res.send({ accessToken: accessToken, refreshToken: refToken });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
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
};
