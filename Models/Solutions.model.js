const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SolutionsSchema = new Schema(
  {
    cardImgUrl: { type: String, required: true, default: "" },
    cardImgPath: { type: String, required: true, default: "" },
    titleCard: { type: String, required: true },
    titleCardLT: { type: String, required: true },
    contentCard: { type: String, required: true },
    contentCardLT: { type: String, required: true },
    contentMain: { type: String, required: true },
    contentMainLT: { type: String, required: true },
  },
  { timestamps: true }
);

SolutionsSchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});
SolutionsSchema.post("save", async function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Error"));
  } else {
    next(error);
  }
});
const Solutions = mongoose.model("solutions", SolutionsSchema);

module.exports = Solutions;
