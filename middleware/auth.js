require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWTSECRET = process.env.JWTSECRET;

module.exports = (req, res, next) => {
  if (!req.get("Authorization")) {
    req.isAuth = false;
    return next();
  }

  const token = req.get("Authorization").split(" ")[1];

  try {
    decodedToken = jwt.verify(token, JWTSECRET);
    if (!decodedToken) {
      req.isAuth = false;
      return next();
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
  } catch (err) {
    req.isAuth = false;
    return next();
  }
};
