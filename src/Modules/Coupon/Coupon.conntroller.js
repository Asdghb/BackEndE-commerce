const { asyncHandler } = require("../../Utils/asyncHandler");
const Coupon = require("../../../DB/Models/Coupon.models");
const vouchercode = require("voucher-code-generator"); // لانشاء كبون خصم كود عشوائى voucher-code-generator
// __________________________________________________________________________
// create code
const CreateCoupon = asyncHandler(async (req, res, next) => {
  // مفهوم الكود : عايز كبون من خمس ارقام
  const code = vouchercode.generate({ length: 5 })[0];
  //   create coupon
  const coupon = await Coupon.create({
    name: code,
    discount: req.body.discount,
    expiredAt: new Date(req.body.expiredAt).getTime(),
    createdBy: req.user._id,
  });
  return res.status(201).json({
    success: true,
    message: "Create Coupon Successfliy",
    results: coupon,
  });
});
// __________________________________________________________________________
// update code
const UpdateCoupon = asyncHandler(async (req, res, next) => {
  // check code
  const coupon = await Coupon.findOne({
    name: req.params.code,
    expiredAt: { $gt: new Date() },
  });

  if (!coupon) {
    return next(new Error("Invalid Code!"));
  }
  coupon.discount = req.body.discount ? req.body.discount : coupon.discount;
  coupon.expiredAt = req.body.expiredAt
    ? new Date(req.body.expiredAt).getTime()
    : coupon.expiredAt;
  await coupon.save();
  return res.json({
    success: true,
    results: coupon,
    message: "coupon Update Successfliy",
  });
});
// __________________________________________________________________________
// delete code
const deleteCoupon = asyncHandler(async (req, res, next) => {
  // create coupon
  const coupon = await Coupon.findOne({
    name: req.params.code,
  });
  if (!coupon) {
    return next(new Error("Invalid Code!"));
  }
  if (req.user._id.toString() !== coupon.createdBy.toString()) {
    return next(new Error("User Not isAuthorized!"));
  }
  await Coupon.findOneAndDelete(req.params.code);
  return res.json({ success: true, message: "Deleted Coupon Successfliy" });
});
// __________________________________________________________________________
//  ALL Coupon
const ALLCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await Coupon.find();
  return res.json({
    success: true,
    results: coupons,
  });
});

// ✅ فقط أول كوبون غير منتهي (صالح للمستخدم)
const ValidCoupons = asyncHandler(async (req, res, next) => {
  const now = Date.now(); // الوقت الحالي
  // ✅ 1) حذف الكوبونات المنتهية أولًا
  await Coupon.deleteMany({ expiredAt: { $lt: now } });
  // ✅ 2) جلب أول كوبون غير منتهي (الأقدم من حيث الإنشاء)
  const coupon = await Coupon.findOne({ expiredAt: { $gt: now } }).sort({
    createdAt: 1,
  });
  // ✅ 3) التحقق من وجود كوبون صالح
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "لا يوجد كوبون صالح حاليًا",
    });
  }
  // ✅ 4) إرجاع الكوبون الصالح
  return res.status(200).json({
    success: true,
    result: coupon,
  });
});

// __________________________________________________________________________
module.exports = {
  CreateCoupon,
  UpdateCoupon,
  deleteCoupon,
  ALLCoupons,
  ValidCoupons,
};
