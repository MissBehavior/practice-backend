const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    assignee: [
      {
        type: Schema.Types.ObjectId,
        ref: "user", // Assuming you have a User model
      },
    ],
    stage: {
      type: String,
      required: true,
      default: "pending", // default stage
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
