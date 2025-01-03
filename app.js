const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
require("./helpers/init_mongodb");
const { verifyAccessToken } = require("./helpers/jwt");
const cors = require("cors");
const http = require("http"); // Import the http module

const { Server } = require("socket.io");

console.log("Server-side code running!");
const AuthRoute = require("./routes/Auth.route");
const PostRoute = require("./routes/Post_public.route");
const CategoryRoute = require("./routes/Category.route");
const PostInternalRoute = require("./routes/Post_internal.route");
const SolutionsRoute = require("./routes/Solutions.route");
const GalleryRoute = require("./routes/Gallery.route");
const AdminRoute = require("./routes/Admin.route");
const UserRoute = require("./routes/User.route");
const TaskRoute = require("./routes/Task.route");

const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};
const io = new Server(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
  socket.on("taskCreated", (data) => {
    console.log("Task created: ", data);
  });
  socket.on("taskUpdated", (data) => {
    console.log("Task taskUpdated: ", data);
  });
  socket.on("deleteTask", (data) => {
    console.log("Task deleteTask: ", data);
  });
  socket.on("error", (error) => {
    console.log("Error: ", error);
  });
});

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("socketio", io);

app.get("/", verifyAccessToken, async (req, res, next) => {
  res.send("Express get");
});
app.use("/auth", AuthRoute);
app.use("/posts", PostRoute);
app.use("/categories", CategoryRoute);
app.use("/postinternal", PostInternalRoute);
app.use("/solutions", SolutionsRoute);
app.use("/gallery", GalleryRoute);
app.use("/user", UserRoute);
app.use("/admin", AdminRoute);
app.use("/tasks", TaskRoute);

// ERROR ROUTES SHOULD BE THE LAST
app.use(async (req, res, next) => {
  if (req.path.startsWith("/socket.io/")) {
    return next(); // Skip to the next middleware
  }
  next(createError.NotFound("Route not found"));
});

app.use(async (error, req, res, next) => {
  if (req.path.startsWith("/socket.io/")) {
    return next(); // Skip to the next middleware
  }
  res.status(error.status || 500);
  res.send({
    error: {
      status: error.status || 500,
      message: error.message,
    },
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
