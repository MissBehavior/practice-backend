const { createClient } = require("@supabase/supabase-js");
const Post = require("../Models/Post_public.model");
const User = require("../Models/User.model");
const createError = require("http-errors");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getPosts: async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndex = (page - 1) * limit;
    const total = await Post.countDocuments();
    try {
      const posts = await Post.find().skip(startIndex).limit(limit);
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
      const post = new Post({ title, content, postPicture: publicUrl, userName, userId: userId, postPath: data.path });
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
      const deleted = await Post.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Post with id ${id} not found`);
      }

      if (deleted.postPath) {
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(deleted.postPath);
        console.log(data);
        console.log(error);
        console.log("DELETED postimg ");

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
    console.log("UPDATE POST CALLED");
    try {
      const { id } = req.params;
      try {
        const { title, content, userName, userId } = req.body;
        const file = req.file;
        const post = await Post.findById(id);

        if (file) {
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
          if (post.postPath) {
            await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([post.postPath]);
          }
          post.postPicture = publicUrl;
          post.postPath = data.path;
        }
        post.title = title;
        post.content = content;
        post.userName = userName;
        post.userId = userId;

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
};
