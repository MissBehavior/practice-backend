const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwt");
const multer = require("multer");
const GalleryController = require("../controller/Gallery.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", GalleryController.getGallery);

router.get("/:id", GalleryController.getGalleryById);

// router.post("/", upload.single("image"), GalleryController.createGallery);
// Route to create a new gallery with multiple image uploads
router.post(
  "/",
  verifyAccessToken,
  upload.fields([
    { name: "cardImgUrl", maxCount: 1 },
    { name: "galleryImages", maxCount: 20 },
  ]),
  GalleryController.createGallery
);
router.delete("/:id", verifyAccessToken, GalleryController.deleteGallery);

// router.patch("/:id", verifyAccessToken, upload.single("image"), GalleryController.updateGallery);
router.patch(
  "/:id",
  verifyAccessToken,
  upload.fields([
    { name: "mainImg", maxCount: 1 },
    { name: "galleryImages", maxCount: 20 },
  ]),
  GalleryController.updateGallery
);
module.exports = router;
