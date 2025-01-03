const { createClient } = require("@supabase/supabase-js");
const Post = require("../Models/Post_public.model");
const User = require("../Models/User.model");
const Category = require("../Models/Category.model");

const createError = require("http-errors");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getPosts: async (req, res, next) => {
    console.log("/getPosts");
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const startIndex = (page - 1) * limit;
      const total = await Post.countDocuments();
      // Fetch all posts with category and userId populated
      const posts = await Post.find().populate("categories").populate("userId", "name email profileImgUrl").sort({ createdAt: -1 }).skip(startIndex).limit(limit).lean();

      // Fetch the latest post
      const latestPost = await Post.findOne().populate("categories").populate("userId", "name email profileImgUrl").sort({ createdAt: -1 }).lean();

      // Fetch most common categories
      const categories = await Post.aggregate([
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $project: {
            _id: "$category._id",
            name: "$category.name",
            count: 1,
          },
        },
      ]);

      res.json({
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        latestPost,
        categories,
        posts,
      });
    } catch (error) {
      next(error);
    }
  },

  getPostsByCategory: async (req, res, next) => {
    console.log("/getPostsByCategory");
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const total = await Post.countDocuments({ categories: categoryId });
      const posts = await Post.find({ categories: categoryId }).populate("categories").sort({ createdAt: -1 }).skip(startIndex).limit(limit).lean();
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
    console.log("/createPost");
    try {
      let { title, titleLT, content, contentLT, userId, categories } = req.body;
      const file = req.file;
      // Ensure categories is always an array
      if (typeof categories === "string") {
        // Attempt to parse it as JSON first
        try {
          categories = JSON.parse(categories);
        } catch (err) {
          // If not JSON, just wrap it in an array
          categories = [categories];
        }
      } else if (!Array.isArray(categories)) {
        // If categories is not an array and not a string, force it into an array
        categories = [categories].filter(Boolean);
      }

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: "At least one category must be selected" });
      }

      const categoryIds = [];
      for (const cat of categories) {
        let categoryDoc;
        // Check if cat is a valid ObjectId
        if (typeof cat === "string" && cat.match(/^[0-9a-fA-F]{24}$/)) {
          categoryDoc = await Category.findById(cat);
          if (!categoryDoc) {
            return res.status(400).json({ error: `Category with ID ${cat} not found` });
          }
        } else {
          // cat is likely a name
          categoryDoc = await Category.findOne({ name: cat });
          if (!categoryDoc) {
            categoryDoc = await Category.create({ name: cat });
          }
        }
        categoryIds.push(categoryDoc._id);
      }

      const { data: uploadData, error: uploadError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(`${Date.now()}-${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

      if (uploadError) {
        console.error("Image upload failed:", uploadError);
        return res.status(500).json({ error: "Image upload failed" });
      }
      const publicUrlData = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(uploadData.path);
      const publicUrl = publicUrlData.data.publicUrl;
      const user = await User.findById(userId);
      if (!user) {
        throw createError.NotFound("User not found");
      }
      const newPost = new Post({
        title,
        titleLT,
        content,
        contentLT,
        postPicture: publicUrl,
        userId,
        postPath: uploadData.path,
        categories: categoryIds,
      });

      const savedPost = await newPost.save();
      res.json(savedPost);
    } catch (error) {
      console.error("Error creating new post:", error);
      next(error);
    }
  },

  deletePostById: async (req, res, next) => {
    console.log("/deletePostById");
    try {
      const { id } = req.params;
      const deleted = await Post.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Post with id ${id} not found`);
      }

      if (deleted.postPath) {
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(deleted.postPath);
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
    console.log("/updatePost");
    try {
      const { id } = req.params;
      const { title, titleLT, content, userId, categories, contentLT } = req.body;
      const file = req.file;
      const post = await Post.findById(id);
      if (!post) {
        throw createError.NotFound("Post not found");
      }
      const user = await User.findById(userId);
      if (!user) {
        throw createError.NotFound("User not found");
      }
      if (categories && (!Array.isArray(categories) || categories.length === 0)) {
        return res.status(400).json({ error: "At least one category must be selected" });
      }
      if (categories) {
        const categoryIds = [];
        for (const cat of categories) {
          let categoryDoc;
          // If it's a valid ObjectId, try by ID
          if (cat.match(/^[0-9a-fA-F]{24}$/)) {
            categoryDoc = await Category.findById(cat);
            if (!categoryDoc) {
              return res.status(400).json({ error: `Category with ID ${cat} not found` });
            }
          } else {
            // Otherwise, treat as a name
            categoryDoc = await Category.findOne({ name: cat });
            if (!categoryDoc) {
              categoryDoc = await Category.create({ name: cat });
            }
          }
          categoryIds.push(categoryDoc._id);
        }
        post.categories = categoryIds;
      }
      if (file) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          return res.status(500).json({ error: "Image upload failed" });
        }
        const publicUrlData = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(uploadData.path);
        const publicUrl = publicUrlData.data.publicUrl;
        // Remove old image if present
        if (post.postPath) {
          await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([post.postPath]);
        }
        post.postPicture = publicUrl;
        post.postPath = uploadData.path;
      }

      if (title) post.title = title;
      if (titleLT) post.titleLT = titleLT;
      if (content) post.content = content;
      if (contentLT) post.contentLT = contentLT;
      if (userId) post.userId = userId;
      const savedPost = await post.save();
      res.status(200).json(savedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      next(error);
    }
  },

  getPostById: async (req, res, next) => {
    console.log("/getPostById");
    try {
      const { id } = req.params;
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(createError(400, "Invalid post ID format"));
      }
      const post = await Post.findById(id).populate("categories").populate("userId", "name email profileImgUrl").lean();
      if (!post) {
        return next(createError(404, "Post not found"));
      }
      const randomPosts = await Post.aggregate([{ $match: { _id: { $ne: post._id } } }, { $sample: { size: 3 } }]);
      res.json({
        post,
        randomPosts,
      });
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      next(createError(500, "Internal Server Error"));
    }
  },
};
