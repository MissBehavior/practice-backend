const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const { verifyAccessToken } = require("../helpers/jwt");
const Solutions = require("../Models/Solutions.model");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", async (req, res, next) => {
  const total = await Solutions.countDocuments();
  console.log(total);
  try {
    const solutions = await Solutions.find();
    console.log(solutions.forEach((solution) => {}));
    res.json({
      solutions,
    });
  } catch (error) {
    next(error);
  }
});
router.get("/:id", async (req, res, next) => {
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
});
router.post("/", verifyAccessToken, async (req, res, next) => {
  try {
    console.log("Solution post route");
    console.log(req.body);
    const solution = new Solutions(req.body);
    //   const user = await User.findById(post.userId);
    //   if (!user) {
    //     throw createError.NotFound("User not found");
    //   }
    const savedSolution = await solution.save();
    res.send(savedSolution);
  } catch (error) {
    console.log(" solution new solution error");
    console.log(error);
    next(error);
  }
});
router.post("/api/upload/", upload.single("image"), async (req, res) => {
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
    }

    const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
    console.log(publicUrl);
    const solution = new Solutions({
      titleCard: titleCard,
      contentCard: contentCard,
      cardImgUrl: publicUrl,
    });
    const savedSolution = await solution.save();
    res.send(savedSolution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", verifyAccessToken, async (req, res, next) => {
  //   console.log("delete route");
  //   console.log(req);
  //   console.log(req.body);
  //   console.log(req.params);
  // TODO: DELETE IMAGE ON SUPRABASE AS WELL
  try {
    const { id } = req.params;
    const deleted = await Solutions.findByIdAndDelete(id);
    if (!deleted) {
      throw createError.NotFound(`Solution with id ${id} not found`);
    }
    res.send(deleted);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", verifyAccessToken, upload.single("image"), async (req, res, next) => {
  // TODO: DELETE OLD IMAGE ON SUPRABASE AS WELL
  try {
    const { id } = req.params;
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
      }

      const publicUrl = await supabase.storage.from(process.env.SUPRABASE_BUCKET_NAME || "imgstorage").getPublicUrl(fileName).data.publicUrl;
      console.log(publicUrl);
      const solution = await Solutions.findById(id);
      solution.titleCard = titleCard;
      solution.contentCard = contentCard;
      solution.cardImgUrl = publicUrl;

      const savedSolution = await solution.save();

      res.send(savedSolution);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error at PATCH" });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
