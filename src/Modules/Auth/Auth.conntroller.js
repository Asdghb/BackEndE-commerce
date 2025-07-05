const { asyncHandler } = require("../../Utils/asyncHandler");
const dotenv = require("dotenv").config();
const User = require("../../../DB/Models/User.models");
const Cart = require("../../../DB/Models/Cart.models");
const Token = require("../../../DB/Models/Token.models");
const sendEmail = require("../../Utils/SendEmail");
const bcryptjs = require("bcryptjs");
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
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  // create user
  const user = await User.create({
    username,
    email,
    password: hashPassword,
    activationCode,
  });
  const mealhtml = template_Email(activationCode, username);
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
// const ActivateAccount = asyncHandler(async (req, res, next) => {
//   const user = await User.findOne({
//     activationCode: req.params.activationCode,
//   });
//   if (!user) {
//     return next(new Error("User Not Found", { cause: 404 }));
//   }
//   user.isCofirmed = true;
//   user.activationCode = undefined;
//   await Cart.create({ user: user._id });
//   await user.save();
//   return res.redirect(
//     `${process.env.CLIENT_URL}/login`
//   );
// });
// POST /api/auth/confirmEmail
// __________________________________________________________________________
// ActivateAccount
const ActivateAccount = asyncHandler(async (req, res, next) => {
  const { activationCode } = req.body;
  const user = await User.findOne({ activationCode });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "الكود غير صحيح أو الحساب مفعل بالفعل ❌",
    });
  }
  user.isCofirmed = true;
  user.activationCode = undefined;
  await Cart.create({ user: user._id, products: [] });
  const existingCart = await Cart.findOne({ user: user._id });
  if (!existingCart) {
    await Cart.create({ user: user._id });
  }
  await user.save();
  return res.json({ success: true, message: "تم تفعيل الحساب بنجاح ✅" });
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
// NewCreateadmin
const NewCreateadmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new Error("يرجى إدخال البريد الإلكتروني وكلمة المرور"));
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new Error("هذا البريد الإلكتروني مستخدم من قبل"));
  }
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  const adminUser = await User.create({
    username: "admin",
    email,
    password: hashedPassword,
    role: "admin",
    isCofirmed: true,
  });
  if (adminUser) {
    res.status(201).json({
      message: "تم إنشاء الأدمن بنجاح ",
    });
  } else {
    return next(new Error("فشل إنشاء الأدمن"));
  }
});
// __________________________________________________________________________
// Get All Admins
const GetAllAdmin = asyncHandler(async (req, res,next) => {
  const admins = await User.find({ role: "admin" });
  if (!admins || admins.length === 0) {
    return next(new Error("لا يوجد أي أدمنز في الموقع حاليًا."));
  }
  res.status(200).json({
    success: true,
    count: admins.length,
    data: admins,
  });
});
// __________________________________________________________________________
// Delete Sangle Admin
const DeleteSangleAdmin = asyncHandler(async (req, res, next) => {
  const { AdminId } = req.params;
  // البحث عن الأدمن
  const admin = await User.findById(AdminId);
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "هذا المستخدم غير موجود",
    });
  }
  if (admin.role !== "admin") {
    return res.status(400).json({
      success: false,
      message: "هذا المستخدم ليس أدمن بالفعل",
    });
  }
  // تعديل الرول من admin إلى user
  admin.role = "user";
  await admin.save();
  res.status(200).json({
    success: true,
    message: "تم تحويل هذا الأدمن إلى مستخدم عادي بنجاح",
    data: admin,
  });
});
// __________________________________________________________________________
module.exports = {
  register,
  ActivateAccount,
  Login,
  sendForgetCode,
  ResetPassword,
  NewCreateadmin,
  GetAllAdmin,
  DeleteSangleAdmin,
};
