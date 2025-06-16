const joi = require("joi");
const JoiObjectId = require("joi-objectid")(joi);
const ValidAddToCart = joi
  .object({
    productId: JoiObjectId().required(),
    quantity: joi.number().integer().min(1).required(),
  })
  .required();
// __________________________________________________________________________
const ValidUpdateCart = joi
  .object({
    productId: JoiObjectId().required(),
    quantity: joi.number().integer().min(1).required(),
  })
  .required();
// __________________________________________________________________________
const ValidRemoveCart = joi
  .object({
    productId: JoiObjectId().required(),
  })
  .required();
// __________________________________________________________________________
module.exports = { ValidAddToCart , ValidUpdateCart , ValidRemoveCart};
