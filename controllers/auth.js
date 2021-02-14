const crypto = require("crypto");
const util = require("util");

require("dotenv").config();
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const SALT = process.env.SALT;
const ITERATIONS = parseInt(process.env.ITERATIONS);
const KEYLEN = parseInt(process.env.KEYLEN);
const HASHALGO = process.env.HASHALGO;
const JWTSECRET = process.env.JWTSECRET;

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Enter Valid data!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  try {
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
    const result = await user.save();
    res.status(201).json({ message: "User Registered!", userId: result._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User does not exist!");
      error.statusCode = 401;
      throw error;
    }
    const hashing = util.promisify(crypto.pbkdf2);
    const derivedKey = hashing(password, SALT, ITERATIONS, KEYLEN, HASHALGO);
    const newPassword = derivedKey.toString("base64");
    if (!newPassword === user.password) {
      const error = new Error("Please enter valid email/password!");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWTSECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token: token, userId: user._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
