const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwt");
const multer = require("multer");
const Post_publicController = require("../controller/Post_public.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", Post_publicController.getPosts);

router.post("/", verifyAccessToken, upload.single("image"), Post_publicController.createPost);

router.delete("/:id", Post_publicController.deletePostById);

router.patch("/:id", Post_publicController.updatePost);

module.exports = router;
