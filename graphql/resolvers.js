const crypto = require("crypto");
const util = require("util");

require("dotenv").config();
const validator = require("validator");

const User = require("../models/user");

const SALT = process.env.SALT;
const ITERATIONS = parseInt(process.env.ITERATIONS);
const KEYLEN = parseInt(process.env.KEYLEN);
const HASHALGO = process.env.HASHALGO;

module.exports = {
  createUser: async function ({ userInput }, req) {
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
      error.data = errors
      error.statusCode = 422
      throw error;
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error("User already exists!");
      error.statusCode = 402;
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
  hello: "Hello World!",
};
