const express = require("express");
const router = express.Router();
const TaskController = require("../controller/Task.Controller");
const { verifyAccessToken } = require("../helpers/jwt");

// Create a new task
router.post("/", TaskController.createTask);

// Get all tasks
router.get("/", TaskController.getTasks);
router.get("/:id", TaskController.getTaskById);

// Update a task
router.put("/:id", TaskController.updateTask);

// Delete a task
router.delete("/:id", TaskController.deleteTask);

module.exports = router;
