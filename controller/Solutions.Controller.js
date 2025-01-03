const createError = require("http-errors");
const Solutions = require("../Models/Solutions.model");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getSolutions: async (req, res, next) => {
    console.log("/getSolutions");
    try {
      const solutions = await Solutions.find();
      res.json({
        solutions,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  getSolutionsById: async (req, res, next) => {
    console.log("/getSolutionsById");
    try {
      const { id } = req.params;
      const solution = await Solutions.findById(id);
      if (!solution) {
        throw createError.NotFound(`Solution with id ${id} not found`);
      }
      res.send(solution);
    } catch (error) {
      next(error);
    }
  },
  createSolution: async (req, res) => {
    console.log("/createSolution");
    try {
      const { titleCard, titleCardLT, contentCard, contentCardLT, contentMain, contentMainLT } = req.body;
      const image = req.files["image"]?.[0];
      if (!image) {
        return res.status(400).json({ error: "Required files missing" });
      }
      const cardFileName = `${Date.now()}-${image.originalname}`;
      const { data: cardData, error: cardError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(cardFileName, image.buffer, {
        contentType: image.mimetype,
        upsert: true,
      });
      if (cardError) {
        console.log("Error uploading card image:", cardError);
        return res.status(500).json({ error: "Error uploading card image" });
      }
      const cardPublicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(cardFileName).data.publicUrl;
      const solution = new Solutions({
        titleCard: titleCard,
        titleCardLT: titleCardLT,
        contentCard: contentCard,
        contentCardLT: contentCardLT,
        contentMain: contentMain,
        contentMainLT: contentMainLT,
        cardImgUrl: cardPublicUrl,
        cardImgPath: cardData.path,
      });

      const savedSolution = await solution.save();
      res.send(savedSolution);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteSolutionById: async (req, res, next) => {
    console.log("/deleteSolutionById");
    try {
      const { id } = req.params;
      const deleted = await Solutions.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Solution with id ${id} not found`);
      }
      if (deleted.cardImgPath) {
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove(deleted.cardImgPath);
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

  updateSolution: async (req, res, next) => {
    console.log("/updateSolution");
    try {
      const { id } = req.params;
      const { titleCard, titleCardLT, contentCard, contentCardLT, contentMain, contentMainLT } = req.body;
      const files = req.files;
      const solution = await Solutions.findById(id);
      if (!solution) {
        return res.status(404).json({ error: "Solution not found" });
      }
      if (files && files.image && files.image[0]) {
        const file = files.image[0];
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data: cardData, error: cardError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
        if (cardError) {
          console.error("Supabase upload error (image):", cardError);
          return res.status(500).json({ error: "Image upload failed" });
        }
        const cardPublicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
        if (solution.cardImgPath) {
          const oldImagePath = solution.cardImgPath;
          const { error: deleteError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([oldImagePath]);

          if (deleteError) {
            console.error("Error deleting old image from Supabase:", deleteError);
          }
        }
        solution.cardImgUrl = cardPublicUrl;
        solution.cardImgPath = cardData.path;
      }

      if (titleCard !== undefined) solution.titleCard = titleCard;
      if (titleCardLT !== undefined) solution.titleCardLT = titleCardLT;
      if (contentCard !== undefined) solution.contentCard = contentCard;
      if (contentCardLT !== undefined) solution.contentCardLT = contentCardLT;
      if (contentMain !== undefined) solution.contentMain = contentMain;
      if (contentMainLT !== undefined) solution.contentMainLT = contentMainLT;
      const savedSolution = await solution.save();
      res.json(savedSolution);
    } catch (error) {
      console.error("Error updating solution:", error);
      res.status(500).json({ error: "Internal Server Error at PATCH /:id" });
    }
  },
};
