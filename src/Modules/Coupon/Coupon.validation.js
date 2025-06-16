const joi = require("joi");
// __________________________________________________________________________
// create
const ValidCoupon = joi
  .object({
    discount: joi.number().min(1).max(100).required(),
    expiredAt: joi.date().greater(new Date()).required(),
  })
  .required();
// __________________________________________________________________________
// update
const ValidCouponUpdate = joi
  .object({
    code: joi.string().length(5).required(),
    discount: joi.number().min(1).max(100), // اختياري
    expiredAt: joi.date().greater(new Date()), // اختياري
  })
  .min(1) // تأكد أن على الأقل حقلًا واحدًا موجود
  .required();
// __________________________________________________________________________
// create
const ValidCoupondelete = joi
  .object({
    code: joi.string().length(5).required(),
  })
  .required();
// __________________________________________________________________________
module.exports = { ValidCoupon, ValidCouponUpdate, ValidCoupondelete };
