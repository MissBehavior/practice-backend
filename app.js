const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
require("./helpers/init_mongodb");
const { verifyAccessToken } = require("./helpers/jwt");
const client = require("./helpers/init_redis");

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

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", verifyAccessToken, async (req, res, next) => {
  console.log("AAAA req.payload");
  console.log(req.payload);
  console.log("AAAA req.payload!!!!!!");
  res.send("Express get");
});
app.use("/auth", AuthRoute);
app.use("/post", PostRoute);
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
