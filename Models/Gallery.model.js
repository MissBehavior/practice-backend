const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GallerySchema = new Schema(
  {
    cardImgUrl: { type: String, required: true, default: "" },
    cardImgPath: { type: String, required: true, default: "" },
    title: { type: String, required: true },
    galleryImages: [
      {
        imgUrl: { type: String, required: false },
        imgPath: { type: String, required: false },
      },
    ],
  },
  { timestamps: true }
);

GallerySchema.pre("save", async function (next) {
  try {
    next();
  } catch (error) {
    next(error);
  }
});
GallerySchema.post("save", async function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Error"));
  } else {
    next(error);
  }
});
const Gallery = mongoose.model("gallery", GallerySchema);

module.exports = Gallery;

// Public Post - > Admin

// Company Post - > Admin + Registered6

// Gallery - > Admin
