const createHttpError = require("http-errors");
const Gallery = require("../Models/Gallery.model");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getGallery: async (req, res, next) => {
    const total = await Gallery.countDocuments();
    try {
      const gallery = await Gallery.find();
      res.json({
        gallery,
      });
    } catch (error) {
      next(error);
    }
  },
  getGalleryById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const gallery = await Gallery.findById(id);
      if (!gallery) {
        throw createHttpError.NotFound(`Gallery with id ${id} not found`);
      }
      res.send(gallery);
    } catch (error) {
      next(error);
    }
  },
  createGallery: async (req, res) => {
    console.log("UPLOADING rest api called");
    try {
      const { title } = req.body;
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
        console.log(data);
        console.log(data.path);
      }
      const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
      console.log(publicUrl);
      const gallery = new Gallery({
        title: title,
        cardImgUrl: publicUrl,
        cardImgPath: data.path,
      });
      const savedGallery = await gallery.save();
      res.send(savedGallery);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteGallery: async (req, res, next) => {
    //   console.log("delete route");
    //   console.log(req);
    //   console.log(req.body);
    //   console.log(req.params);
    // TODO: DELETE IMAGE ON SUPRABASE AS WELL
    console.log(req.body);
    try {
      const { id } = req.params;
      const deleted = await Gallery.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Gallery with id ${id} not found`);
      }
      console.log("DELETED Gallery----------");
      console.log(deleted);
      if (deleted.cardImgPath) {
        console.log("DELETING IMAGE");
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(deleted.cardImgPath);
        console.log(data);
        console.log(error);
        console.log("DELETED IMAGE) ");

        if (error) {
          console.log("delete error");
          console.log(error);
          return res.status(400).json({ error: error.message });
        }
      }
      res.send(deleted);
    } catch (error) {
      console.log("delete error");
      console.log(error);
      next(error);
    }
  },
  updateGallery: async (req, res, next) => {
    // TODO: DELETE OLD IMAGE ON SUPRABASE AS WELL
    try {
      const { id } = req.params;
      try {
        const { title } = req.body;
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
        const gallery = await Gallery.findById(id);
        gallery.title = title;
        gallery.cardImgUrl = publicUrl;

        const savedGallery = await gallery.save();

        res.send(savedGallery);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error at PATCH" });
      }
    } catch (error) {
      next(error);
    }
  },
};
