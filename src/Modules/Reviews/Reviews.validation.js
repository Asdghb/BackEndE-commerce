const joi = require("joi");
const JoiObjectId = require("joi-objectid")(joi);
// __________________________________________________________________________
const ValidDataAddReviews = joi
  .object({
    content: joi.string().max(200).required(),
    productId: joi.string().required(),
  })
  .required();
// __________________________________________________________________________
module.exports = { ValidDataAddReviews };
