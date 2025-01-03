const express = require("express");
const router = express.Router();
const AdminController = require("../controller/Admin.Controller");
const { verifyAccessToken } = require("../helpers/jwt");

router.get("/users", verifyAccessToken, AdminController.getUsers);
router.get("/users/:id", verifyAccessToken, AdminController.getUserById);
router.get("/users/year/:year", verifyAccessToken, AdminController.getUsersByYear);
router.get("/users/count/all", verifyAccessToken, AdminController.getUserCount);
router.put("/users/:id", verifyAccessToken, AdminController.updateUser);
router.post("/users", verifyAccessToken, AdminController.createUser);
router.delete("/users/:id", verifyAccessToken, AdminController.deleteUser);

router.get("/gallery/count/all", verifyAccessToken, AdminController.getGalleryCount);

module.exports = router;
