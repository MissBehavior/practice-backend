const express = require("express");
const router = express.Router();
const CategoryController = require("../controller/Category.Controller");
const { verifyAccessToken } = require("../helpers/jwt");

// Routes to manage categories
router.post("/", CategoryController.createCategory);
router.get("/", CategoryController.getCategories);

module.exports = router;
