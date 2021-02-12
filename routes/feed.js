const router = require("express").Router();
const { body } = require("express-validator/check");

const feedController = require("../controller/feed");

// GET -> /feed/posts
router.get("/posts", feedController.getPosts);

// POST -> /feed/posts
router.post(
  "/post",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPosts
);

module.exports = router;
