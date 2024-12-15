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
    console.log("UPLOADING rest api called");
    try {
      const { titleCard, contentCard } = req.body;
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
      const solution = new Solutions({
        titleCard: titleCard,
        contentCard: contentCard,
        cardImgUrl: publicUrl,
        cardImgPath: data.path,
      });
      const savedSolution = await solution.save();
      res.send(savedSolution);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deleteSolutionById: async (req, res, next) => {
    //   console.log("delete route");
    //   console.log(req);
    //   console.log(req.body);
    //   console.log(req.params);
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

  // cardImgUrl: { type: String, required: true, default: "" },
  // cardImgPath: { type: String, required: true, default: "" },
  // titleCard: { type: String, required: true },
  // contentCard: { type: String, required: true },
  // contentMain: { type: String, required: false, default: "" },
  // contentMainImg: { type: String, required: false, default: "" },
  // contentMainPath: { type: String, required: false, default: "" },

  updateSolutionDetail: async (req, res, next) => {
    // TODO: DELETE OLD IMAGE ON SUPRABASE AS WELL
    console.log("----");
    try {
      const { id } = req.params;
      try {
        const { titleCard, contentCard, contentMain, contentMainImg } = req.body;
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
        const solution = await Solutions.findById(id);
        solution.titleCard = titleCard;
        solution.contentMain = contentMain;
        solution.contentMainImg = publicUrl;
        solution.contentMainPath = data.path;

        const savedSolution = await solution.save();

        res.send(savedSolution);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error at PATCH" });
      }
    } catch (error) {
      next(error);
    }
  },

  updateSolution: async (req, res, next) => {
    console.log("UpdateSolution CALLED");
    try {
      const { id } = req.params;
      const { titleCard, contentCard, cardImgUrl } = req.body; // Get existing image URL from body
      const file = req.file;

      // Find the existing solution
      const solution = await Solutions.findById(id);
      if (!solution) {
        return res.status(404).json({ error: "Solution not found" });
      }
      let publicUrl = cardImgUrl;
      if (file) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
        if (error) {
          console.error("Supabase upload error:", error);
          return res.status(500).json({ error: "Image upload failed" });
        }
        publicUrl = supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;

        const oldImagePath = solution.cardImgUrl.split("/").pop(); // Extract the filename from the URL
        const { error: deleteError } = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").remove([oldImagePath]);
        if (deleteError) {
          console.error("Error deleting old image from Supabase:", deleteError);
        }
      }

      solution.titleCard = titleCard;
      solution.contentCard = contentCard;
      solution.cardImgUrl = publicUrl;

      const savedSolution = await solution.save();
      res.send(savedSolution);
    } catch (error) {
      console.error("Error updating solution:", error);
      res.status(500).json({ error: "Internal Server Error at PATCH" });
    }
  },
};
