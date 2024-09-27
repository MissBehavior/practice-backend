const express = require("express");
const router = express.Router();
const AdminController = require("../controller/Admin.Controller");

router.get("/users", AdminController.getUsers);
router.get("/users/:id", AdminController.getUserById);
router.get("/users/year/:year", AdminController.getUsersByYear);
// router.post("/createuser", AdminController.createUser);
// router.patch("/users/:id", AdminController.updateUser);
router.delete("/users/:id", AdminController.deleteUser);

module.exports = router;
