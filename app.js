const path = require("path");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

// Constants
const PORT = process.env.SERVER_PORT || 3333;
const PASS = process.env.MongoPassword;
const URI = `mongodb+srv://toor:${PASS}@express-learning.pgj2f.mongodb.net/blog?retryWrites=true&w=majority`;

// Other
const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "images");
  },
  filename: (req, file, callBack) => {
    callBack(null, Date.now().toString() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, callBack) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callBack(null, true);
  } else {
    callBack(null, false);
  }
};
const upload = multer({ storage: fileStorage, fileFilter: fileFilter }).single(
  "image"
);

// Middlewares
app.use(express.json());
app.use(upload);
app.use("/images", express.static(path.join(__dirname, "images")));

// General Middlewares/Configurations
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,Content-Type, Authorization, x-id, Content-Length, X-Requested-With"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Routes
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data;

  res.status(statusCode).json({ message, data });
});

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    const server = app.listen(PORT, () => {
      console.log(`Server started on ${PORT}...`);
    });
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client Connected...");
    });
  })
  .catch((err) => console.log(err));
