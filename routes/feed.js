const router = require("express").Router();

const feedController = require("../controller/feed");

// GET -> /feed/posts
router.get("/posts", feedController.getPosts);

// POST -> /feed/posts
router.post("/post", feedController.createPosts);


module.exports = router;
