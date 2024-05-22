const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const Post = require("../Models/Post_public.model");
const { verifyAccessToken } = require("../helpers/jwt");

router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.find();
    console.log(
      posts.forEach((post) => {
        console.log(post.title);
        console.log(post.id);
        console.log(post.createdAt);
        console.log(post.updatedAt);
        console.log(post.content);
      })
    );
    res.send(posts);
  } catch (error) {
    next(error);
  }
});

router.post("/", verifyAccessToken, async (req, res, next) => {
  try {
    const post = new Post(req.body);
    const user = await User.findById(post.userId);
    if (!user) {
      throw createError.NotFound("User not found");
    }
    const savedPost = await post.save();
    res.send(savedPost);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Post.findByIdAndDelete(id);
    if (!deleted) {
      throw createError.NotFound(`Post with id ${id} not found`);
    }
    res.send(deleted);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Post.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      throw createError.NotFound(`Post with id ${id} not found`);
    }
    res.send(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
