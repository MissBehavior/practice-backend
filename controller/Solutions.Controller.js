const createError = require("http-errors");
const Solutions = require("../Models/Solutions.model");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

module.exports = {
  getSolutions: async (req, res, next) => {
    const total = await Solutions.countDocuments();
    try {
      const solutions = await Solutions.find();
      console.log("LAST BEFORE SEND");
      res.json({
        solutions,
      });
    } catch (error) {
      console.log("WE ARE IN ERRORS");
      console.log(error);
      next(error);
    }
  },
  getSolutionsById: async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log(typeof id);
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
    console.log("creating solution");
    try {
      const { titleCard, titleCardLT, contentCard, contentCardLT, contentMain, contentMainLT } = req.body;
      const image = req.files["image"]?.[0];
      const contentMainImage = req.files["contentMainImg"]?.[0];

      if (!image || !contentMainImage) {
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

      const contentMainFileName = `${Date.now()}-${contentMainImage.originalname}`;
      const { data: contentMainData, error: contentMainError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(contentMainFileName, contentMainImage.buffer, {
        contentType: contentMainImage.mimetype,
        upsert: true,
      });

      if (contentMainError) {
        console.log("Error uploading content main image:", contentMainError);
        return res.status(500).json({ error: "Error uploading content main image" });
      }

      const contentMainPublicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(contentMainFileName).data.publicUrl;

      const solution = new Solutions({
        titleCard: titleCard,
        titleCardLT: titleCardLT,
        contentCard: contentCard,
        contentCardLT: contentCardLT,
        contentMain: contentMain,
        contentMainLT: contentMainLT,
        cardImgUrl: cardPublicUrl,
        cardImgPath: cardData.path,
        contentMainImg: contentMainPublicUrl,
        contentMainPath: contentMainData.path,
      });

      const savedSolution = await solution.save();
      res.send(savedSolution);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteSolutionById: async (req, res, next) => {
    // TODO: DELETE IMAGE ON SUPRABASE AS WELL
    console.log(req.body);
    try {
      const { id } = req.params;
      const deleted = await Solutions.findByIdAndDelete(id);
      if (!deleted) {
        throw createError.NotFound(`Solution with id ${id} not found`);
      }
      console.log("DELETED SOLUTION----------");
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
  updateSolutionDetail: async (req, res, next) => {
    console.log("----");
    try {
      const { id } = req.params;
      const { titleCard, titleCardLT, contentCard, contentCardLT, contentMain, contentMainLT } = req.body;
      const file = req.file;

      const solution = await Solutions.findById(id);
      if (!solution) {
        return res.status(404).json({ error: "Solution not found" });
      }

      if (file) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

        if (error) {
          console.log("Error uploading contentMainImg:", error);
          return res.status(500).json({ error: "Error uploading contentMainImg" });
        }

        const publicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;

        if (solution.contentMainPath) {
          const oldImageName = solution.contentMainPath.split("/").pop();
          const { error: deleteError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([solution.contentMainPath]);

          if (deleteError) {
            console.error("Error deleting old contentMainImg from Supabase:", deleteError);
          }
        }

        solution.contentMainImg = publicUrl;
        solution.contentMainPath = data.path;
      }

      solution.titleCard = titleCard;
      solution.titleCardLT = titleCardLT;
      solution.contentCard = contentCard;
      solution.contentCardLT = contentCardLT;
      solution.contentMain = contentMain;
      solution.contentMainLT = contentMainLT;
      const savedSolution = await solution.save();

      res.json(savedSolution);
    } catch (error) {
      console.error("Error in updateSolutionDetail:", error);
      res.status(500).json({ error: "Internal Server Error at PATCH /detail/:id" });
    }
  },

  updateSolution: async (req, res, next) => {
    console.log("UpdateSolution CALLED");
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
      if (files && files.contentMainImg && files.contentMainImg[0]) {
        const file = files.contentMainImg[0];
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data: contentMainData, error: contentMainError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

        if (contentMainError) {
          console.error("Supabase upload error (contentMainImg):", contentMainError);
          return res.status(500).json({ error: "Content Main Image upload failed" });
        }

        const contentMainPublicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
        if (solution.contentMainPath) {
          const oldContentMainPath = solution.contentMainPath;
          const { error: deleteError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([oldContentMainPath]);
          if (deleteError) {
            console.error("Error deleting old contentMainImg from Supabase:", deleteError);
          }
        }
        solution.contentMainImg = contentMainPublicUrl;
        solution.contentMainPath = contentMainData.path;
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
