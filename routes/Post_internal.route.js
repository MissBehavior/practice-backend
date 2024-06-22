const express = require("express");
const router = express.Router();
const { verifyAccessToken, verifyIsUserEmployee } = require("../helpers/jwt");
const multer = require("multer");
const Post_internalController = require("../controller/Post_internal.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", verifyIsUserEmployee, Post_internalController.getPosts);

router.post("/", verifyIsUserEmployee, upload.single("image"), Post_internalController.createPost);

router.delete("/:id", verifyIsUserEmployee, Post_internalController.deletePostById);

router.patch("/:id", verifyIsUserEmployee, Post_internalController.updatePost);

module.exports = router;
