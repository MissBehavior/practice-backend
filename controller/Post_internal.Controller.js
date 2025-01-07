const { createClient } = require("@supabase/supabase-js");
const PostInternal = require("../Models/Post_internal.model");
const User = require("../Models/User.model");
const createError = require("http-errors");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getPosts: async (req, res, next) => {
    console.log("/getPosts");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = req.query.query || "";
    const filter = {};
    if (query) {
      filter.$or = [{ title: { $regex: query, $options: "i" } }, { content: { $regex: query, $options: "i" } }, { userName: { $regex: query, $options: "i" } }];
    }
    const startIndex = (page - 1) * limit;
    try {
      const total = await PostInternal.countDocuments(filter);
      const posts = await PostInternal.find(filter).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").sort({ createdAt: -1 }).skip(startIndex).limit(limit).lean();
      res.json({
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        posts,
      });
    } catch (error) {
      next(error);
    }
  },

  getPostById: async (req, res, next) => {
    console.log("/getPostById");
    const { id } = req.params;
    try {
      const post = await PostInternal.findById(id).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").populate("comments.likes", "name email profileImgUrl").lean();

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      next(error);
    }
  },

  createPost: async (req, res, next) => {
    console.log("/createPost");
    try {
      const { title, content, userName, userId } = req.body;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileName = `${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
      if (error) {
        console.error("Error uploading to Supabase:", error);
      }
      const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
      const user = await User.findById(userId);
      if (!user) {
        throw createError.NotFound("User not found");
      }

      const post = new PostInternal({
        title,
        content,
        postPicture: publicUrl,
        userName,
        userId,
        postPath: data.path,
      });
      await post.save();
      const populatedPost = await PostInternal.findById(post._id).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").populate("comments.likes", "name email profileImgUrl").lean();
      res.send(populatedPost);
    } catch (error) {
      console.error("Error creating new post:", error);
      next(error);
    }
  },

  deletePostById: async (req, res, next) => {
    console.log("/deletePostById");
    try {
      const { id } = req.params;
      const deleted = await PostInternal.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Post with id ${id} not found`);
      }
      if (deleted.postPath) {
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([deleted.postPath]);
        if (error) {
          console.error("Error deleting image from Supabase:", error);
          return res.status(400).json({ error: error.message });
        }
      }
      res.send(deleted);
    } catch (error) {
      next(error);
    }
  },

  updatePost: async (req, res, next) => {
    console.log("/updatePost");
    try {
      const { id } = req.params;
      const { title, content, imageUrl } = req.body;
      const file = req.file;
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required." });
      }
      const post = await PostInternal.findById(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }
      post.title = title;
      post.content = content;
      if (file) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
        if (error) {
          console.error("Error uploading to Supabase:", error);
          return res.status(500).json({ error: "Error uploading image." });
        }
        const { data: publicData, error: publicError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName);
        if (publicError) {
          console.error("Error fetching public URL:", publicError);
          return res.status(500).json({ error: "Error fetching image URL." });
        }
        const publicUrl = publicData.publicUrl;
        if (post.postPath) {
          const oldImagePath = post.postPath;
          const { error: deleteError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([oldImagePath]);
          if (deleteError) {
            console.error("Error deleting old image from Supabase:", deleteError);
          }
        }

        post.postPicture = publicUrl;
        post.postPath = data.path;
      } else if (imageUrl) {
        post.postPicture = imageUrl;
      }

      await post.save();

      const populatedPost = await PostInternal.findById(post._id).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").populate("comments.likes", "name email profileImgUrl").lean();

      // Respond with the updated post
      res.status(200).json(populatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      next(error);
    }
  },

  likeUnlikePost: async (req, res) => {
    console.log("/likeUnlikePost");
    try {
      const { userId } = req.body;
      const { id: postId } = req.params;

      const post = await PostInternal.findById(postId).select("likes");
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      const userLikedPost = post.likes.includes(userId);
      const postUpdate = userLikedPost ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
      const userUpdate = userLikedPost ? { $pull: { likedPosts: postId } } : { $addToSet: { likedPosts: postId } };
      await Promise.all([PostInternal.updateOne({ _id: postId }, postUpdate), User.updateOne({ _id: userId }, userUpdate)]);
      const populatedPost = await PostInternal.findById(postId).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").populate("comments.likes", "name email profileImgUrl").lean();

      res.status(200).json(populatedPost);
    } catch (error) {
      console.error("Error in likeUnlikePost controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  commentOnPost: async (req, res) => {
    console.log("/commentOnPost");
    try {
      const { text, userId } = req.body;
      const postId = req.params.id;
      if (!text) {
        return res.status(400).json({ error: "Text field is required" });
      }
      const post = await PostInternal.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      const comment = { user: userId, text };
      post.comments.push(comment);
      await post.save();
      const populatedPost = await PostInternal.findById(postId).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").populate("comments.likes", "name email profileImgUrl").lean();
      res.status(200).json(populatedPost);
    } catch (error) {
      console.log("Error in commentOnPost controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  deleteCommentOnPost: async (req, res, next) => {
    console.log("/deleteCommentOnPost");
    try {
      const { id: postId, commentId } = req.params;
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      if (!postId || !commentId) {
        return res.status(400).json({ error: "Post ID and Comment ID are required." });
      }

      const post = await PostInternal.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      if (
        !user.isAdmin &&
        !comment.user.equals(user._id)
      ) {
        return res.status(401).json({ error: "Unauthorized." });
      }
      const comment = post.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found." });
      }
      post.comments.pull(commentId);
      await post.save();
      const populatedPost = await PostInternal.findById(postId)
        .populate("userId", "name email profileImgUrl")
        .populate("comments.user", "name email profileImgUrl")
        .populate("likes", "name email profileImgUrl")
        .populate("comments.likes", "name email profileImgUrl")
        .lean();

      // Respond with the Updated Post
      res.status(200).json(populatedPost);
    } catch (error) {
      console.error("Error in deleteCommentOnPost controller:", error);
      next(error);
    }
  },


  getLikedPosts: async (req, res) => {
    console.log("/getLikedPosts");
    const userId = req.params.id;

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const likedPosts = await PostInternal.find({ _id: { $in: user.likedPosts } })
        .populate("userId", "name email profileImgUrl")
        .populate("comments.user", "name email profileImgUrl")
        .populate("likes", "name email profileImgUrl")
        .lean();

      res.status(200).json(likedPosts);
    } catch (error) {
      console.log("Error in getLikedPosts controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getPostWithMostLikes: async (req, res, next) => {
    console.log("/getPostWithMostLikes");
    try {
      const post = await PostInternal.findOne().sort({ likes: -1 }).populate("userId", "name email profileImgUrl").lean();
      if (!post) {
        return res.status(404).json({ error: "No posts found" });
      }

      res.status(200).json(post);
    } catch (error) {
      console.error("Error in getPostWithMostLikes controller: ", error);
      next(error);
    }
  },
  getPostWithMostComments: async (req, res, next) => {
    console.log("/getPostWithMostComments");
    try {
      const posts = await PostInternal.aggregate([
        {
          $addFields: {
            commentsCount: { $size: "$comments" },
          },
        },
        { $sort: { commentsCount: -1 } },
        { $limit: 1 },
      ]);

      if (posts.length === 0) {
        return res.status(404).json({ error: "No posts found" });
      }
      const post = await PostInternal.findById(posts[0]._id).populate("userId", "name email profileImgUrl").lean();

      res.status(200).json(post);
    } catch (error) {
      console.error("Error in getPostWithMostComments controller: ", error);
      next(error);
    }
  },

  likeUnlikeComment: async (req, res) => {
    console.log("/likeUnlikeComment");
    try {
      const { userId } = req.body;
      const { postId, commentId } = req.params;
      const post = await PostInternal.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      const comment = post.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      const userLikedComment = comment.likes.includes(userId);
      if (userLikedComment) {
        comment.likes = comment.likes.filter((likeUserId) => likeUserId !== userId);
      } else {
        comment.likes.push(userId);
      }
      await post.save();
      const populatedPost = await PostInternal.findById(postId).populate("userId", "name email profileImgUrl").populate("comments.user", "name email profileImgUrl").populate("likes", "name email profileImgUrl").populate("comments.likes", "name email profileImgUrl").lean();
      res.status(200).json(populatedPost);
    } catch (error) {
      console.log("Error in likeUnlikeComment controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
