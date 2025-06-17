const { asyncHandler } = require("../../Utils/asyncHandler");
const User = require("../../../DB/Models/User.models");
const Cart = require("../../../DB/Models/Cart.models");
const Token = require("../../../DB/Models/Token.models");
const sendEmail = require("../../Utils/SendEmail");
const bcryptjs = require("bcryptjs");
const dotenv = require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Random = require("randomstring");
const template_Email = require("../../Utils/Tamplet_Email");
const Tamplet_Email_ResetPassword = require("../../Utils/ResetPassword");
// __________________________________________________________________________
// register
const register = asyncHandler(async (req, res, next) => {
  // data req
  const { username, email, password } = req.body;
  // check user
  const IsUser = await User.findOne({ email });
  if (IsUser) {
    return next(new Error("Email already Register!", { cause: 409 }));
  }
  // hashPassword
  const hashPassword = await bcryptjs.hash(
    password,
    Number(process.env.SALT_HASH)
  );
  // activationCode
  const activationCode = crypto.randomBytes(64).toString("hex");
  // create user
  const user = await User.create({
    username,
    email,
    password: hashPassword,
    activationCode,
  });
  // create link activationCode
  const link = `https://fornt-end-e-commerce-13o8.vercel.app/auth/confirmEmail/${activationCode}`;
  const mealhtml = template_Email(link, username);
  // send Email
  const isSendEmail = await sendEmail({
    to: email,
    subject: "Activate Account",
    html: mealhtml,
  });
  if (isSendEmail) {
    return res.json({ success: true, message: "Pleasa review you Email" });
  } else {
    next(new Error("Something went wrong!"));
  }
});
// __________________________________________________________________________
// ActivateAccount
const ActivateAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    activationCode: req.params.activationCode,
  });
  if (!user) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  user.isCofirmed = true;
  user.activationCode = undefined;
  await Cart.create({ user: user._id });
  await user.save();
  return res.redirect("https://fornt-end-e-commerce-13o8.vercel.app/Login");
});
// __________________________________________________________________________
// Login
const Login = asyncHandler(async (req, res, next) => {
  // 1- data from req
  const { email, password } = req.body;
  // 2- check user db
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new Error("The User is unavailable at the moment. Email!", { cause: 401 })
    );
  }
  // 3- check isCofirmed
  if (!user.isCofirmed) {
    return next(new Error("The account is not activated.", { cause: 400 }));
  }
  // 4- check password
  const checkpass = await bcryptjs.compare(password, user.password);
  if (!checkpass) {
    return next(new Error("The password is incorrect.", { cause: 400 }));
  }
  // 5- Token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.TOKEN_KEY
  );
  // 6- save token model
  const tokenuser = await Token.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });
  // 7- user online
  user.status = "online";
  await user.save();
  // 8- res json
  return res.json({ success: true, results: token });
});
// __________________________________________________________________________
// sendForgetCode
const sendForgetCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  // check user
  const user = await User.findOne({ email });
  if (!user) {
    return next(new Error("User not found!"));
  }
  // generate code
  const code = Random.generate({
    length: 5,
    charset: "numeric",
  });
  // save code in db
  user.forgetCode = code;
  await user.save();
  // send email
  const isSent = await sendEmail({
    to: user.email,
    subject: "Reset Password",
    html: Tamplet_Email_ResetPassword(code),
  });
  if (isSent) {
    return res.json({
      success: true,
      message: "Check your email for reset instructions.",
    });
  } else {
    return next(new Error("Failed to send the reset email. Please try again."));
  }
});
// __________________________________________________________________________
// Reset Password
const ResetPassword = asyncHandler(async (req, res, next) => {
  const { forgetCode, password } = req.body;
  // check if user exists
  const user = await User.findOne({ forgetCode });
  if (!user) {
    return next(new Error("Code NO Fulse!"));
  }
  // delete code from user
  user.forgetCode = undefined;
  // hash new password
  user.password = await bcryptjs.hash(password, Number(process.env.SALT_HASH));
  // save updated user
  await user.save();
  // invalidate all existing tokens (logout from all devices)
  const tokens = await Token.find({ user: user._id });
  for (const token of tokens) {
    token.isValid = false;
    await token.save();
  }

  // send response
  return res.json({
    success: true,
    message: "Password reset successfully, please try to login!",
  });
});
// __________________________________________________________________________
module.exports = {
  register,
  ActivateAccount,
  Login,
  sendForgetCode,
  ResetPassword,
};
