const crypto = require("crypto");
const util = require("util");

require("dotenv").config();
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

const clearImage = require("../utils/file");

const SALT = process.env.SALT;
const ITERATIONS = parseInt(process.env.ITERATIONS);
const KEYLEN = parseInt(process.env.KEYLEN);
const HASHALGO = process.env.HASHALGO;
const JWTSECRET = process.env.JWTSECRET;

module.exports = {
  createUser: async function ({ userInput }) {
    const email = userInput.email;
    const name = userInput.name;
    const password = userInput.password;

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: "Invalid email!" });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({ message: "Enter valid password!" });
    }
    if (errors.length > 0) {
      const error = new Error("Enter valid data!");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error("User already exists!");
      error.statusCode = 401;
      throw error;
    }
    const hashing = util.promisify(crypto.pbkdf2);
    const derivedKey = await hashing(
      password,
      SALT,
      ITERATIONS,
      KEYLEN,
      HASHALGO
    );
    const hashedPassword = derivedKey.toString("base64");
    const user = new User({
      email: email,
      password: hashedPassword,
      name: name,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User does not exist!");
      error.statusCode = 401;
      throw error;
    }

    const hashing = util.promisify(crypto.pbkdf2);
    const derivedKey = await hashing(
      password,
      SALT,
      ITERATIONS,
      KEYLEN,
      HASHALGO
    );
    const newPassword = derivedKey.toString("base64");

    if (newPassword !== user.password) {
      const error = new Error("Please enter valid email/password!");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWTSECRET, {
      expiresIn: "1h",
    });

    return { token: token, userId: user._id.toString() };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.statusCode = 401;
      throw error;
    }

    const title = postInput.title;
    const content = postInput.content;
    const imageUrl = "images\\" + postInput.imageUrl;

    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: "Enter valid title!" });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: "Enter valid Content!" });
    }
    if (errors.length > 0) {
      const error = new Error("Enter valid data!");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid User!");
      error.data = errors;
      error.statusCode = 401;
      throw error;
    }
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: user,
    });
    const createdPost = await post.save();

    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },

  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.statusCode = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },

  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.statusCode = 401;
      throw error;
    }

    const title = postInput.title;
    const content = postInput.content;
    const imageUrl = "images\\" + postInput.imageUrl;

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("User is not authorized!");
      error.code = 403;
      throw error;
    }

    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push({ message: "Enter valid title!" });
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push({ message: "Enter valid Content!" });
    }
    if (errors.length > 0) {
      const error = new Error("Enter valid data!");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    post.title = title;
    post.content = content;
    if (imageUrl !== "images\\undefined") {
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  deletePost: async function ({ id }, req) {
    console.log("IN DELETE");
    if (!req.isAuth) {
      const error = new Error("Not Authenticated!");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("User is not authorized!");
      error.code = 403;
      throw error;
    }

    try {
      console.log(post.imageUrl);
      clearImage(post.imageUrl);
      await Post.findByIdAndDelete(id);

      const user = await User.findById(req.userId);
      user.posts.pull(id);
      await user.save();

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  },
};
