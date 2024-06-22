const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
require("./helpers/init_mongodb");
const { verifyAccessToken } = require("./helpers/jwt");
const client = require("./helpers/init_redis");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPRABASE_URL, process.env.SUPRABASE_KEY);

async function uploadFile(file) {
  const { data, error } = await supabase.storage.from("imgstorage").upload("censor.jpg", file);
  if (error) {
    console.log("ERROR HAPPENED CHIRP");
    console.log(error);
  } else {
    // Handle success
    console.log("HANDLING NOW CHIRP");
  }
}
console.log("STARTING SERVER CHRIP");
// Set "foo" to "bar"
// (async () => {
//   try {
//     await client.SET("foo", "bar");
//     console.log("SET");
//     console.log(await client.get("foo")); // Now using await
//   } catch (err) {
//     console.error(err);
//   }
// })();

console.log("Server-side code running!");
const AuthRoute = require("./routes/Auth.route");
const PostRoute = require("./routes/Post_public.route");
const PostInternalRoute = require("./routes/Post_internal.route");
const SolutionsRoute = require("./routes/Solutions.route");
const GalleryRoute = require("./routes/Gallery.route");

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", verifyAccessToken, async (req, res, next) => {
  res.send("Express get");
});
app.use("/auth", AuthRoute);
app.use("/post", PostRoute);
app.use("/postinternal", PostInternalRoute);
app.use("/solutions", SolutionsRoute);
app.use("/gallery", GalleryRoute);

app.use(async (req, res, next) => {
  // const error = new Error('Not found');
  // error.status = 404;
  // next(error);
  next(createError.NotFound("Route not found"));
});

app.use(async (error, req, res, next) => {
  res.status(error.status || 500);
  res.send({
    error: {
      status: error.status || 500,
      message: error.message,
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
