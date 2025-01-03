const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwt");
const multer = require("multer");
const SolutionsController = require("../controller/Solutions.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", SolutionsController.getSolutions);

router.get("/:id", SolutionsController.getSolutionsById);

router.post(
  "/api/upload/",
  upload.fields([
    { name: "image", maxCount: 1 },
    // { name: "contentMainImg", maxCount: 1 },
  ]),
  verifyAccessToken,
  SolutionsController.createSolution
);

router.delete("/:id", verifyAccessToken, SolutionsController.deleteSolutionById);

router.patch(
  "/:id",
  verifyAccessToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    // { name: "contentMainImg", maxCount: 1 },
  ]),
  SolutionsController.updateSolution
);
// router.patch("/detail/:id", verifyAccessToken, upload.single("contentMainImg"), SolutionsController.updateSolutionDetail);

module.exports = router;
