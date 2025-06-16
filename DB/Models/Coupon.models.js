const mongoose = require("mongoose");
const CouponSchame = new mongoose.Schema(
  {
    name: { type: String, required: true },
    discount: { type: Number, min: 1, max: 100, required: true },
    expiredAt: Number,
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
const Coupon = mongoose.model("Coupon", CouponSchame);
module.exports = Coupon;
