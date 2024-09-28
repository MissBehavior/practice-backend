const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwt");
const multer = require("multer");
const UserController = require("../controller/User.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploadprofile/", verifyAccessToken, upload.single("image"), UserController.uploadProfileImg);
router.delete("/deleteprofile/:id", verifyAccessToken, UserController.deleteProfileImg);

// router.get("/users/:id", AdminController.getUserById);
// router.get("/users/year/:year", AdminController.getUsersByYear);
// router.get("/users/count/all", AdminController.getUserCount);
// router.delete("/users/:id", AdminController.deleteUser);

// router.get("/gallery/count/all", AdminController.getGalleryCount);

module.exports = router;
