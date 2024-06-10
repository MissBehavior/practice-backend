const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwt");
const multer = require("multer");
const SolutionsController = require("../controller/Solutions.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", SolutionsController.getSolutions);
router.get("/:id", SolutionsController.getSolutionById);

router.post("/api/upload/", upload.single("image"), SolutionsController.createSolution);

router.delete("/:id", verifyAccessToken, SolutionsController.deleteSolutionById);

router.patch("/:id", verifyAccessToken, upload.single("image"), SolutionsController.updateSolution);

module.exports = router;
