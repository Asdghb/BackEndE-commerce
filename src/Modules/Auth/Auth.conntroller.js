const { asyncHandler } = require("../../Utils/asyncHandler");
const dotenv = require("dotenv").config();
const User = require("../../../DB/Models/User.models");
const Course = require("../../../DB/Models/Course");
const Token = require("../../../DB/Models/Token.models");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
// __________________________________________________________________________
// Register User
const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // تحقق من وجود المستخدم
  const IsUser = await User.findOne({ email });
  if (IsUser) {
    return next(new Error("Email already registered!", { cause: 409 }));
  }

  // تشفير الباسورد
  const hashPassword = await bcryptjs.hash(
    password,
    Number(process.env.SALT_HASH)
  );

  // إنشاء المستخدم في قاعدة البيانات
  const user = await User.create({
    username,
    email,
    password: hashPassword,
  });

  // الرد النهائي
  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
  });
});
// __________________________________________________________________________
// Login
const Login = asyncHandler(async (req, res, next) => {
  const { email, password, activationCode } = req.body;

  // 1- التحقق من وجود المستخدم
  const user = await User.findOne({ email });
  if (!user) {
    return next(
      new Error("The User is unavailable at the moment. Email!", { cause: 401 })
    );
  }

  // 2- التحقق من كلمة السر
  const checkpass = await bcryptjs.compare(password, user.password);
  if (!checkpass) {
    return next(new Error("The password is incorrect.", { cause: 400 }));
  }

  // 3- التحقق من كود التفعيل لو تم إرساله
  if (activationCode) {
    if (user.activationCode !== activationCode) {
      return next(new Error("Activation code is invalid.", { cause: 400 }));
    }
    // الكود صحيح، فعل الحساب
    user.isCofirmed = true;
    await user.save();
  }

  // 4- إنشاء التوكن
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      isCofirmed: user.isCofirmed,
    },
    process.env.TOKEN_KEY
  );

  // 5- حفظ التوكن في DB
  await Token.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });

  // 6- تحديث حالة المستخدم online
  user.status = "online";
  await user.save();

  // 7- إرسال الرد
  return res.json({
    success: true,
    results: token,
    role: user.role,
    isCofirmed: user.isCofirmed,
  });
});
//  __________________________________________________________________________
// admin
const createActivationCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // 1- التحقق من أن الادمن هو اللي ينفذ العملية
  if (req.user.role !== "admin") {
    return next(
      new Error("Only admins can generate activation codes.", { cause: 403 })
    );
  }

  // 2- البحث عن المستخدم بالإيميل
  const user = await User.findOne({ email });
  if (!user) {
    return next(new Error("User with this email not found.", { cause: 404 }));
  }

  // 3- توليد كود تفعيل عشوائي (مثلاً 8 أحرف وأرقام)
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();

  // 4- حفظ الكود في المستخدم
  user.activationCode = code;
  await user.save();

  // 5- إرسال الكود كاستجابة
  res.json({ success: true, activationCode: code });
});
// __________________________________________________________________________
// admin get code and eamil
const getAllActivationCodes = asyncHandler(async (req, res, next) => {
  // 1- تأكد أن الشخص هو الادمن
  if (req.user.role !== "admin") {
    return next(
      new Error("Only admins can view activation codes.", { cause: 403 })
    );
  }

  // 2- جلب كل المستخدمين مع الايميل وكود التفعيل وحالة التفعيل
  const users = await User.find({}, { email: 1, activationCode: 1, isCofirmed: 1, _id: 0 });

  // 3- حساب عدد المفعلين وغير المفعلين
  const activatedCount = users.filter(u => u.isCofirmed).length;
  const notActivatedCount = users.filter(u => !u.isCofirmed).length;

  // 4- إرسال النتائج
  res.json({
    success: true,
    results: users,
    stats: {
      activated: activatedCount,
      notActivated: notActivatedCount,
      total: users.length
    }
  });
});
// __________________________________________________________________________
//  get courses user
// جلب الكورسات للمستخدم بشرط التفعيل
const getCoursesForUser = asyncHandler(async (req, res, next) => {
  const userId = req.user.id; // جاي من middleware للتحقق من التوكن

  // 1- جلب بيانات المستخدم
  const user = await User.findById(userId);
  if (!user) {
    return next(new Error("User not found.", { cause: 404 }));
  }

  // 2- تحقق من التفعيل
  if (!user.isCofirmed) {
    return res.json({
      success: true, // هنا 200 عادي
      message: "لحسابك كامل الوصول، اشترك في الكورس عبر WhatsApp: 01220978353",
      courses: [], // ترجع array فاضية بدل ما ترجع خطأ
    });
  }

  // 3- جلب كل الكورسات المتاحة (يمكنك إضافة شرط isActive لو موجود في السكيمة)
  const courses = await Course.find({});

  // 4- إرسال النتائج، حتى لو مفيش كورسات يرجع array فاضية بدون أي خطأ
  res.json({ success: true, courses });
});
// __________________________________________________________________________
// - الخطوة الى بعد كدا رفع الكورس على اليتيوب الاول
// admin createCourse
const createCourse = asyncHandler(async (req, res, next) => {
  const { title, description, videos } = req.body; // videos = array of YouTube links

  if (!title || !videos || !Array.isArray(videos) || videos.length === 0) {
    return next(
      new Error("Title and at least one video link are required.", {
        cause: 400,
      })
    );
  }

  const course = await Course.create({
    title,
    description,
    videos,
  });

  res.status(201).json({ success: true, course });
});
// كدا لرفع
// {
//   "title": "Learn MERN Stack",
//   "description": "كورس شامل لتعلم MERN Stack",
//   "videos": [
//     "https://youtu.be/VIDEO_ID1",
//     "https://youtu.be/VIDEO_ID2",
//     "https://youtu.be/VIDEO_ID3"
//   ]
// }
// __________________________________________________________________________
// GET /user/watchedVideos/:courseId
const getWatchedVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id; 
  const { courseId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const watched = user.watchedVideos.get(courseId) || [];
  res.json({ watched });
});
// __________________________________________________________________________
// POST /user/watchVideo
// body: { courseId: "xxx", videoIndex: 0 }
const markVideoWatched = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId, videoIndex } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  let watched = user.watchedVideos.get(courseId) || [];
  if (!watched.includes(videoIndex)) {
    watched.push(videoIndex);
    user.watchedVideos.set(courseId, watched);
    await user.save();
  }

  res.json({ message: "Video marked as watched", watched });
});
// __________________________________________________________________________
// - الاشتراك
// - الدخول ب الكود و بدونة
// - انشاء كود لمستخدم
// - عرض الاميل و الكود للادمن
// - عرض الكورس للمستخدم المفعل بالكود
// - api لرفع الكورس على الموقع من خلال الرابط
// - الفرونت

// القادم
// - رفع الكورس على اليتيوب

module.exports = {
  createActivationCode,
  getCoursesForUser,
  getAllActivationCodes,
  getWatchedVideos,
  markVideoWatched,
  createCourse,
  register,
  Login,
};
