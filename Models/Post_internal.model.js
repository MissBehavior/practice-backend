const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CommentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.String,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);
const PostInternalSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    postPicture: { type: String, required: false, default: "" },
    postPath: { type: String, required: false, default: "" },
    userId: {
      type: mongoose.Schema.Types.String,
      ref: "user",
      required: true,
    },
    userName: {
      type: mongoose.Schema.Types.String,
      ref: "user",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.String,
        ref: "user",
      },
    ],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

PostInternalSchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});
PostInternalSchema.post("save", async function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Error "));
  } else {
    next(error);
  }
});

const PostInternal = mongoose.model("postinternal", PostInternalSchema);

module.exports = PostInternal;
