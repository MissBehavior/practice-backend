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
      const mainFile = req.files.cardImgUrl[0];
      const additionalFiles = req.files.galleryImages;

      if (!mainFile) {
        return res.status(400).json({ error: "Main image not uploaded" });
      }

      // Upload main image
      const mainFileName = `${Date.now()}-${mainFile.originalname}`;
      const { data: mainData, error: mainError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(mainFileName, mainFile.buffer, {
        contentType: mainFile.mimetype,
        upsert: true,
      });
      if (mainError) {
        console.log(mainError);
        return res.status(500).json({ error: mainError.message });
      }
      const mainPublicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(mainFileName).data.publicUrl;

      // Upload additional images
      let galleryImages = [];
      if (additionalFiles && additionalFiles.length > 0) {
        for (const file of additionalFiles) {
          const additionalFileName = `${Date.now()}-${file.originalname}`;
          const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(additionalFileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });
          if (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
          }
          const publicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(additionalFileName).data.publicUrl;
          galleryImages.push({
            imgUrl: publicUrl,
            imgPath: data.path,
          });
        }
      }

      const gallery = new Gallery({
        title,
        cardImgUrl: mainPublicUrl,
        cardImgPath: mainData.path,
        galleryImages,
      });

      const savedGallery = await gallery.save();
      res.send(savedGallery);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteGallery: async (req, res, next) => {
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
      if (deleted.additionalImages && deleted.additionalImages.length > 0) {
        for (const img of deleted.additionalImages) {
          await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([img.imgPath]);
        }
      }
      res.send(deleted);
    } catch (error) {
      console.log("delete error");
      console.log(error);
      next(error);
    }
  },
  updateGallery: async (req, res) => {
    console.log("UPDATE Gallery");
    try {
      const { id } = req.params;
      const { title, existingCardImgUrl, existingGalleryImages } = req.body;

      let existingGalleryImagesArray = [];
      if (existingGalleryImages) {
        existingGalleryImagesArray = Array.isArray(existingGalleryImages) ? existingGalleryImages : [existingGalleryImages];
      }
      const mainFile = req.files.mainImg ? req.files.mainImg[0] : null;
      const additionalFiles = req.files.galleryImages || [];

      const gallery = await Gallery.findById(id);
      if (!gallery) {
        return res.status(404).json({ error: `Gallery with id ${id} not found` });
      }
      if (mainFile) {
        const mainFileName = `${Date.now()}-${mainFile.originalname}`;
        const { data: mainData, error: mainError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(mainFileName, mainFile.buffer, {
          contentType: mainFile.mimetype,
          upsert: true,
        });
        if (mainError) {
          console.log(mainError);
          return res.status(500).json({ error: mainError.message });
        }
        const mainPublicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(mainFileName).data.publicUrl;
        if (gallery.cardImgPath) {
          await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([gallery.cardImgPath]);
        }

        gallery.cardImgUrl = mainPublicUrl;
        gallery.cardImgPath = mainData.path;
      } else {
        if (!existingCardImgUrl || existingCardImgUrl !== gallery.cardImgUrl) {
          if (gallery.cardImgPath) {
            await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([gallery.cardImgPath]);
          }
          gallery.cardImgUrl = "";
          gallery.cardImgPath = "";
        }
      }
      const oldImages = gallery.galleryImages || [];
      const imagesToKeep = oldImages.filter((img) => existingGalleryImagesArray.includes(img.imgUrl));
      const imagesToDelete = oldImages.filter((img) => !existingGalleryImagesArray.includes(img.imgUrl));
      for (const img of imagesToDelete) {
        await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([img.imgPath]);
      }
      let newAdditionalImages = [];
      for (const file of additionalFiles) {
        const additionalFileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(additionalFileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
        if (error) {
          console.log(error);
          return res.status(500).json({ error: error.message });
        }
        const publicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(additionalFileName).data.publicUrl;

        newAdditionalImages.push({
          imgUrl: publicUrl,
          imgPath: data.path,
        });
      }
      gallery.galleryImages = [...imagesToKeep, ...newAdditionalImages];
      gallery.title = title;
      const savedGallery = await gallery.save();

      res.send(savedGallery);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error at PATCH" });
    }
  },
};
