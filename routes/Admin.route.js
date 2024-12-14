const express = require("express");
const router = express.Router();
const AdminController = require("../controller/Admin.Controller");

router.get("/users", AdminController.getUsers);
router.get("/users/:id", AdminController.getUserById);
router.get("/users/year/:year", AdminController.getUsersByYear);
router.get("/users/count/all", AdminController.getUserCount);
router.put("/users/:id", AdminController.updateUser);
router.post("/users", AdminController.createUser);
// router.patch("/users/:id", AdminController.updateUser);
router.delete("/users/:id", AdminController.deleteUser);

router.get("/gallery/count/all", AdminController.getGalleryCount);

module.exports = router;
