const { createClient } = require("@supabase/supabase-js");
const PostInternal = require("../Models/Post_internal.model");
const User = require("../Models/User.model");
const createError = require("http-errors");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getPosts: async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const total = await PostInternal.countDocuments();
    try {
      const posts = await PostInternal.find().sort({ createdAt: -1 }).skip(startIndex).limit(limit);
      console.log(posts.forEach((post) => {}));
      res.json({
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        posts,
      });
    } catch (error) {
      next(error);
    }
  },
  createPost: async (req, res, next) => {
    console.log("UPLOADING rest api for post called");
    console.log(req.body);
    console.log(req.body.userId);
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
        console.log("ERROR HAPPENED CHIRP");
        console.log(error);
      } else {
        console.log("HANDLING NOW CHIRP");
      }
      const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
      console.log("-------------------------------");
      console.log(title, content, userName, publicUrl, userId);
      console.log("-------------------------------");
      const user = await User.findById(userId);
      if (!user) {
        throw createError.NotFound("User not found");
      }
      const post = new PostInternal({ title, content, postPicture: publicUrl, userName, userId: userId, postPath: data.path });
      console.log(post);
      console.log(post.title);
      console.log(post.content);
      console.log(post.userName);
      console.log(post.userId);
      console.log(post.postPicture);
      console.log(post.postPath);

      const savedPost = await post.save();
      res.send(savedPost);
    } catch (error) {
      console.log(" post new post error");
      console.log(error);
      next(error);
    }
  },
  deletePostById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await PostInternal.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Post with id ${id} not found`);
      }

      if (deleted.postPath) {
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(deleted.postPath);
        console.log("DELETED postimg ");
        console.log(data);
        console.log(error);

        if (error) {
          console.log("delete error");
          console.log(error);
          return res.status(400).json({ error: error.message });
        }
      }
      res.send(deleted);
    } catch (error) {
      next(error);
    }
  },
  updatePost: async (req, res, next) => {
    // TODO: DELETE OLD IMAGE ON SUPRABASE AS WELL
    console.log("UPDATE POST CALLED");
    try {
      const { id } = req.params;
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
          console.log("ERROR HAPPENED CHIRP");
          console.log(error);
        } else {
          console.log("HANDLING NOW CHIRP");
        }

        const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
        console.log(publicUrl);
        const post = await PostInternal.findById(id);
        post.title = title;
        post.content = content;
        post.postPicture = publicUrl;
        post.userName = userName;
        post.userId = userId;
        post.postPath = data.path;

        const savedPost = await post.save();

        res.send(savedPost);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error at PATCH" });
      }
    } catch (error) {
      next(error);
    }
  },

  likeUnlikePost: async (req, res) => {
    try {
      const { userId } = req.body;
      const { id: postId } = req.params;
      const post = await PostInternal.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      const userLikedPost = post.likes.includes(userId);
      if (userLikedPost) {
        // Unlike post
        await PostInternal.updateOne({ _id: postId }, { $pull: { likes: userId } });
        await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

        const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
        res.status(200).json(updatedLikes);
      } else {
        // Like post
        post.likes.push(userId);
        await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
        await post.save();

        // const notification = new Notification({
        //   from: userId,
        //   to: post.user,
        //   type: "like",
        // });
        // await notification.save();
        const updatedLikes = post.likes;
        res.status(200).json(updatedLikes);
      }
    } catch (error) {
      console.log("Error in likeUnlikePost controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  commentOnPost: async (req, res) => {
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

      res.status(200).json(post);
    } catch (error) {
      console.log("Error in commentOnPost controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getLikedPosts: async (req, res) => {
    const userId = req.params.id;

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
        .populate({
          path: "user",
          select: "-password",
        })
        .populate({
          path: "comments.user",
          select: "-password",
        });

      res.status(200).json(likedPosts);
    } catch (error) {
      console.log("Error in getLikedPosts controller: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
