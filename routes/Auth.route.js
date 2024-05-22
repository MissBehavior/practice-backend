const express = require("express");
const router = express.Router();
const AuthController = require("../controller/Auth.Controller");

router.post("/register", AuthController.register);

router.post("/login", AuthController.login);
router.post("/refresh_token", AuthController.refreshToken);
router.delete("/logout", AuthController.logout);

module.exports = router;
