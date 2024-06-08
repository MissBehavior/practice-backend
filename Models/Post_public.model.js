const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
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
  },
  { timestamps: true }
);

PostSchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});
PostSchema.post("save", async function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Error "));
  } else {
    next(error);
  }
});
const Post = mongoose.model("post", PostSchema);

module.exports = Post;

// Public Post - > Admin

// Company Post - > Admin + Registered6

// Gallery - > Admin
