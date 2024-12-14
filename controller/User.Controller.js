const { createClient } = require("@supabase/supabase-js");
const createError = require("http-errors");
const User = require("../Models/User.model");
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
  updateProfile: async (req, res, next) => {
    console.log("/updateprofile");
    console.log(req.body);
    const { id } = req.params;
    const { name, telefon, languages } = req.body;
    const user = await User.findById(id);
    if (!user) {
      throw createError.NotFound("User not found");
    }
    if (user.id !== id) {
      throw createError.Unauthorized("Unauthorized");
    }

    // Update fields
    user.name = name;
    user.telefon = telefon;
    if (Array.isArray(languages)) {
      user.languages = languages;
    }

    const savedUser = await user.save();
    res.json({ message: "Profile updated successfully", savedUser });
  },
  getUserById: async (req, res, next) => {
    console.log("getUserById");
    try {
      const id = req.params.id;
      if (!id || id.length !== 24) throw createError.BadRequest("Please provide a valid user id");
      const user = await User.findById(id).select("-password");
      if (!user) throw createError.NotFound("User not found");
      res.send(user);
    } catch (error) {
      console.log("ERROR HAPPENED");
      console.log(error);
      next(error);
    }
  },
};
