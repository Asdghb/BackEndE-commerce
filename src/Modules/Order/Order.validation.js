const joi = require("joi");
const JoiObjectId = require("joi-objectid")(joi);
// __________________________________________________________________________
const CreateOrdervalid = joi
  .object({
    address: joi.string().min(10).required(),
    phone: joi.string().length(11).required(),
    coupon: joi
      .string()
      .optional()
      .allow(null, "")
      .custom((value, helpers) => {
        if (value && value.length < 5) {
          return helpers.message(
            "The coupon must contain at least 5 characters."
          );
        }
        return value;
      }),
    payment: joi.string().valid("cash", "visa").required(),
  })
  .required();
// __________________________________________________________________________
const CancelOrdervalid = joi
  .object({
    orderId: JoiObjectId().required(),
  })
  .required();
// __________________________________________________________________________
const UpdateSingleOrderValid = joi
  .object({
    orderId: JoiObjectId().required(),
    status: joi
      .string()
      .valid(
        "placed",
        "refunded",
        "shipped",
        "delivered",
        "cancelled",
        "visa payed",
        "failed to pay"
      )
      .optional()
      .required(),
  })
  .required();
// __________________________________________________________________________
module.exports = { CreateOrdervalid, CancelOrdervalid, UpdateSingleOrderValid };
