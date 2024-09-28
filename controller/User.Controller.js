const { createClient } = require("@supabase/supabase-js");
const createError = require("http-errors");
const User = require("../Models/User.model");
const Gallery = require("../Models/Gallery.model");
const { authSchema, signUpSchema } = require("../helpers/validation.schema");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");
const client = require("../helpers/init_redis");
const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  uploadProfileImg: async (req, res, next) => {
    console.log("/uploadprofile");
    const { userId } = req.body;
    console.log(userId);

    const file = req.file;
    const user = await User.findById(userId);
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    if (!user) {
      throw createError.NotFound("User not found");
    } else {
      const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(user.profileImgPath);
      console.log(data);
      console.log(error);
      console.log("DELETED old image");

      if (error) {
        console.log("delete before upload error");
        console.log(error);
        return res.status(400).json({ error: error.message });
      }
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    try {
      const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
      if (error) {
        console.log("ERROR HAPPENED CHIRP");
        console.log(error);
      } else {
        console.log("HANDLING NOW CHIRP");
        console.log(data);
        console.log(data.path);
      }
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
      console.log(publicUrl);
      user.profileImgUrl = publicUrl;
      user.profileImgPath = data.path;
      console.log(user);
      console.log(user.profileImgUrl);
      console.log(user.profileImgPath);
      const savedUser = await user.save();
      res.json({ message: "File uploaded successfully", savedUser });
    } catch (err) {
      await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([`${fileName}`]);

      console.error("Error:", err);
      res.status(500).json({ error: "Failed to upload image and update user." });
    }
  },
  deleteProfileImg: async (req, res, next) => {
    const { id } = req.params;
    console.log(id);
    const user = await User.findById(id);
    if (!user) {
      throw createError.NotFound("User not found");
    }
    const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(user.profileImgPath);
    console.log(data);
    console.log(error);
    console.log("DELETED old image");
    if (error) {
      console.log("delete before upload error");
      console.log(error);
      return res.status(400).json({ error: error.message });
    }
    user.profileImgUrl = "";
    user.profileImgPath = "";
    const savedUser = await user.save();
    res.json({ message: "Profile image deleted successfully", savedUser });
  },
};
