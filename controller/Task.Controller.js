// controllers/taskController.js

const Task = require("../Models/Task");
const createError = require("http-errors");
const UID = () => Math.random().toString(36).substring(2, 10);

let tasks = {
  pending: {
    title: "pending",
    items: [
      {
        id: UID(),
        title: "Send the Figma file to Dima",
        comments: [],
      },
    ],
  },
  ongoing: {
    title: "ongoing",
    items: [
      {
        id: UID(),
        title: "Review GitHub issues",
        comments: [
          {
            name: "David",
            text: "Ensure you review before merging",
            id: UID(),
          },
        ],
      },
    ],
  },
  completed: {
    title: "completed",
    items: [
      {
        id: UID(),
        title: "Create technical contents",
        comments: [
          {
            name: "Dima",
            text: "Make sure you check the requirements",
            id: UID(),
          },
        ],
      },
    ],
  },
};
// Create a new task
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
    const tasks = await Task.find().populate("assignee");
    res.json(tasks);
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
    const updatedTask = await Task.findByIdAndUpdate(id, taskData, { new: true });
    console.log("UPDATED TASK:::::::::::");
    console.log(taskData);

    // Emit the updated task to all connected clients
    req.app.get("socketio").emit("taskUpdated", updatedTask);

    res.json(updatedTask);
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
