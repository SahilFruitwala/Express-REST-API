const crypto = require("crypto");
const util = require("util");

require("dotenv").config();
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");

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
    console.log(newPassword);
    console.log("---------------------------------");
    console.log(user.password);
    console.log("---------------------------------");

    if (newPassword !== user.password) {
      console.log("1");
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
      error.data = errors;
      error.statusCode = 401;
      throw error;
    }

    const title = postInput.title;
    const content = postInput.content;
    const imageUrl = postInput.imageUrl;

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
};
