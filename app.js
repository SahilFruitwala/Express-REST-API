require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const feedRoutes = require("./routes/feed");

// ? Constants
const PORT = process.env.SERVER_PORT;
const PASS = process.env.MongoPassword;
const URI = `mongodb+srv://toor:${PASS}@express-learning.pgj2f.mongodb.net/blog?retryWrites=true&w=majority`;

// ? Other
const app = express();

// ? Middlewares
app.use(express.json());

// ? General Middlewares/Configurations
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ? Routes
app.use("/feed", feedRoutes);

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(PORT, () => {
      console.log(`Server started on ${PORT}...`);
    });
  })
  .catch((err) => console.log(err));
