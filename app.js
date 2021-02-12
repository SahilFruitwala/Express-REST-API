require("dotenv").config();
const express = require("express");

const feedRoutes = require("./routes/feed");

// ? Constants
const PORT = process.env.SERVER_PORT || 3333;

// ? Other
const app = express();

// ? Middlewares
app.use(express.json());

// ? General Middlewares/Configurations
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ? Routes
app.use("/feed", feedRoutes);

// ? Server
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}...`);
});
