// controller/Category.controller.js
const Category = require("../Models/Category.model");
const createError = require("http-errors");

module.exports = {
  createCategory: async (req, res, next) => {
    try {
      const { name } = req.body;
      console.log("Name:", name);

      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        throw createError.Conflict("Category already exists");
      }
      const category = new Category({ name });
      const savedCategory = await category.save();
      res.status(201).json(savedCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      next(error);
    }
  },
  getCategories: async (req, res, next) => {
    try {
      const categories = await Category.find().sort({ name: 1 });
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      next(error);
    }
  },
};
