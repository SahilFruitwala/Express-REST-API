const { validationResult } = require("express-validator/check");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: 1,
        title: "First Post",
        content: "This is the first post",
        imageUrl: "images/baba.png",
        creator: {
          name: "Baba",
        },
        createdAt: new Date().toISOString(),
      },
    ],
  });
};

exports.createPosts = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: "Validation Failed!", errors: errors.array() });
  }

  // create post in db
  res.status(201).json({
    message: "Success!",
    post: {
      _id: new Date().toISOString(),
      title: title,
      content: content,
      creator: {
        name: "Baba",
      },
      createdAt: new Date().toISOString(),
    },
  });
};
