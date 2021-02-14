require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWTSECRET = process.env.JWTSECRET;

module.exports = (req, res, next) => {
  
  if (!req.get("Authorization")) {
    const error = new Error("Not Authenticated!");
    error.statusCode = 401;
    throw error;
  }

  const token = req.get("Authorization").split(" ")[1];
  
  try {
    decodedToken = jwt.verify(token, JWTSECRET);
    if (!decodedToken) {
      const error = new Error("Not Authenticated!");
      error.statusCode = 401;
      throw error;
    }
    req.userId = decodedToken.userId;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    throw err;
  }
};
