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
      type: Schema.Types.ObjectId,
      ref: "user",
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
        ref: "user",
      },
    ],
    stage: {
      type: String,
      required: true,
      default: "Unassigned", // default stage
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
