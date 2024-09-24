const express = require("express");
const router = express.Router();
const AdminController = require("../controller/Admin.Controller");

router.get("/users", AdminController.getUsers);
router.get("/users/:id", AdminController.getUserById);
// router.post("/createuser", AdminController.createUser);
// router.patch("/users/:id", AdminController.updateUser);
// router.delete("/users", AdminController.deleteUser);

module.exports = router;
