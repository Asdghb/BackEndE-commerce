const express = require("express");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const { CreateCoupon, UpdateCoupon , deleteCoupon , ALLCoupons } = require("./Coupon.conntroller");
const { ValidCoupon, ValidCouponUpdate , ValidCoupondelete } = require("./Coupon.validation");
const CouponRouter = express.Router();
// __________________________________________________________________________
// create coupon
// http://localhost:3000/Coupon/
CouponRouter.post(
  "/",
  isAuthentication,
  isAuthorized("admin"),
  isValid(ValidCoupon),
  CreateCoupon
);
// __________________________________________________________________________
// Update coupon
// http://localhost:3000/Coupon/:code
CouponRouter.patch(
  "/:code",
  isAuthentication,
  isAuthorized("admin"),
  isValid(ValidCouponUpdate),
  UpdateCoupon
);
// __________________________________________________________________________
// delete coupon
// http://localhost:3000/Coupon/:code
CouponRouter.delete(
  "/:code",
  isAuthentication,
  isAuthorized("admin"),
  isValid(ValidCoupondelete),
  deleteCoupon
);
// __________________________________________________________________________
// get coupons
// http://localhost:3000/Coupon/
CouponRouter.get(
  "/",
  ALLCoupons
);
// __________________________________________________________________________
module.exports = CouponRouter;
