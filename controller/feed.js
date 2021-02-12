const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{ title: "First Post", content: "This is the first post" }],
  });
};

exports.createPosts = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  // create post in db
  res.status(201).json({
    message: "Success!",
    post: { id: new Date().toISOString(), title: title, content: content },
  });
};
