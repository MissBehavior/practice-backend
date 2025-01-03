const express = require("express");
const router = express.Router();
const { verifyAccessToken, verifyIsUserEmployee } = require("../helpers/jwt");
const multer = require("multer");
const UserController = require("../controller/User.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploadprofile/", verifyAccessToken, upload.single("image"), UserController.uploadProfileImg);
router.delete("/deleteprofile/:id", verifyAccessToken, UserController.deleteProfileImg);
router.patch("/:id", verifyAccessToken, UserController.updateProfile);
router.get("/:id", verifyAccessToken, UserController.getUserById);
router.get("/", verifyIsUserEmployee, UserController.getAllUsers);

module.exports = router;
