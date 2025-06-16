const { asyncHandler } = require("../../Utils/asyncHandler");
const Coupon = require("../../../DB/Models/Coupon.models");
const vouchercode = require("voucher-code-generator");// لانشاء كبون خصم كود عشوائى voucher-code-generator
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
  return res.status(201).json({ success: true, results: coupon });
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
    message: "coupon Update true!",
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
  return res.json({ success: true, message: "Deleted Coupon true!" });
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
// __________________________________________________________________________
module.exports = { CreateCoupon, UpdateCoupon, deleteCoupon, ALLCoupons };
