// controllers/taskController.js

const Task = require("../Models/Task");
const createError = require("http-errors");

exports.createTask = async (req, res, next) => {
  try {
    console.log("Task created");
    const taskData = req.body;
    const task = new Task(taskData);
    const savedTask = await task.save();

    // Emit the new task to all connected clients via Socket.IO
    req.app.get("socketio").emit("taskCreated", savedTask);

    res.status(201).json(savedTask);
  } catch (error) {
    next(error);
  }
};

// Get all tasks
exports.getTasks = async (req, res, next) => {
  try {
    console.log("Tasks fetched");
    const tasks = await Task.find().populate("assignee", "name email profileImgUrl");
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// Get a task by ID
exports.getTaskById = async (req, res, next) => {
  try {
    console.log("Task fetched by ID");
    const { id } = req.params;
    const task = await Task.findById(id).populate("assignee", "name email profileImgUrl");
    if (!task) {
      throw createError(404, "Task not found");
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
};

// Update a task
exports.updateTask = async (req, res, next) => {
  try {
    console.log("Task updated");
    const { id } = req.params;
    const taskData = req.body;
    console.log("UPDATED TASK:::::::::::");
    console.log(taskData);
    const updatedTask = await Task.findByIdAndUpdate(id, taskData, { new: true }).populate("assignee", "name email profileImgUrl");
    console.log("UPDATED TASK:::::::::::");
    console.log(updatedTask);
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    req.app.get("socketio").emit("taskUpdated", updatedTask);

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};
exports.getTaskStats = async (req, res, next) => {
  console.log("Task stats fetched");
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
        },
      },
    ]);
    const formattedStats = stats.map((item) => ({
      stage: item._id,
      count: item.count,
    }));

    res.json(formattedStats);
  } catch (error) {
    next(error);
  }
};
// Delete a task
exports.deleteTask = async (req, res, next) => {
  try {
    console.log("Task deleted");
    const { id } = req.params;
    await Task.findByIdAndDelete(id);

    // Emit the deleted task ID to all connected clients
    req.app.get("socketio").emit("taskDeleted", id);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
