const express = require("express");
const router = express.Router();
const { verifyAccessToken, verifyIsUserEmployee } = require("../helpers/jwt");
const multer = require("multer");
const Post_internalController = require("../controller/Post_internal.Controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", verifyIsUserEmployee, Post_internalController.getPosts);
router.get("/:id", verifyIsUserEmployee, Post_internalController.getPostById);

router.post("/", verifyIsUserEmployee, upload.single("image"), Post_internalController.createPost);

router.delete("/:id", verifyIsUserEmployee, Post_internalController.deletePostById);

router.patch("/:id", verifyIsUserEmployee, upload.single("image"), Post_internalController.updatePost);

router.patch("/like/:id", verifyIsUserEmployee, Post_internalController.likeUnlikePost);
router.patch("/:postId/comment/:commentId/like", verifyIsUserEmployee, Post_internalController.likeUnlikeComment);
router.get("/post-stats/most-liked", Post_internalController.getPostWithMostLikes);
router.get("/post-stats/most-commented", Post_internalController.getPostWithMostComments);

router.post("/comment/:id", verifyIsUserEmployee, Post_internalController.commentOnPost);
router.delete("/comment/:id/:commentId", verifyIsUserEmployee, Post_internalController.deleteCommentOnPost);

module.exports = router;
