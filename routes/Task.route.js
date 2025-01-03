const express = require("express");
const router = express.Router();
const TaskController = require("../controller/Task.Controller");
const { verifyAccessToken, verifyIsUserEmployee } = require("../helpers/jwt");

// Create a new task
router.post("/", verifyIsUserEmployee, TaskController.createTask);

// Get all tasks
router.get("/", verifyIsUserEmployee, TaskController.getTasks);
router.get("/:id", verifyIsUserEmployee, TaskController.getTaskById);

// Update a task
router.put("/:id", verifyIsUserEmployee, TaskController.updateTask);

// Delete a task
router.delete("/:id", verifyIsUserEmployee, TaskController.deleteTask);
// TASK STATS
router.get("/tasks/stats", verifyIsUserEmployee, TaskController.getTaskStats);
module.exports = router;
