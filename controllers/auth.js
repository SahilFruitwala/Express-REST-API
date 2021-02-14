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

exports.signup = (req, res, next) => {
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

  const hashing = util.promisify(crypto.pbkdf2);

  hashing(password, SALT, ITERATIONS, KEYLEN, HASHALGO)
    .then((derivedKey) => {
      const hashedPassword = derivedKey.toString("base64");
      const user = new User({
        email: email,
        password: hashedPassword,
        name: name,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User Registered!", userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  let loadedUser;
  console.log('1');

  User.findOne({ email: email })
    .then((user) => {
      console.log('Here');
      if (!user) {
        const error = new Error("User does not exist!");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      const hashing = util.promisify(crypto.pbkdf2);
      return hashing(password, SALT, ITERATIONS, KEYLEN, HASHALGO);
    })
    .then((derivedKey) => {
      console.log("There");
      const newPassword = derivedKey.toString("base64");
      
      console.log('New Password: ', newPassword);
      console.log('DB Password: ', loadedUser.password);

      if (!newPassword === loadedUser.password) {
        const error = new Error("Please enter valid email/password!");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        { userId: loadedUser._id.toString() }, 
        JWTSECRET, 
        { expiresIn: "1h", }
      );
      res.status(200).json({token: token, userId: loadedUser._id.toString()})
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
