const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { asyncHandler } = require("../Utils/asyncHandler");
const Token = require("../../DB/Models/Token.models");
const User = require("../../DB/Models/User.models");
const isAuthentication = asyncHandler(async (req, res, next) => {
  // 1- check token , isValid !
  let token = req.headers["token"];
  if (!token || !token.startsWith(process.env.BEARER_KEY)) {
    return next(new Error("Valid token is requird", 400));
  };
  // 2- check token payload !
  token = token.split(process.env.BEARER_KEY)[1];
  const decoded = jwt.verify(token, process.env.TOKEN_KEY);
  if (!decoded) {
    return next(new Error("InValid Token!"));
  };
  // 3- check token in DB !
  const TokenDB = await Token.findOne({ token, isValid: true });
  if (!TokenDB) {
    return next(new Error("token Is Valid false!"));
  };
  // 4- check User Existence !
  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    return next(new Error("User Not Found!"));
  };
  // 5- new req User !
  req.user = user;
  // 6- return next !
  return next();
});
module.exports = isAuthentication;
