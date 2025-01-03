const express = require("express");
const router = express.Router();
const CategoryController = require("../controller/Category.Controller");

router.post("/", CategoryController.createCategory);
router.get("/", CategoryController.getCategories);

module.exports = router;
