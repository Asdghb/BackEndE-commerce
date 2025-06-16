
const joi = require("joi");
const JoiObjectId = require("joi-objectid")(joi); 
// __________________________________________________________________________
const BrandValidData = joi
  .object({
    name: joi.string().min(3).max(20).required(),
  })
  .required();
// __________________________________________________________________________
const UpdateBrandValidData = joi
  .object({
    name: joi.string().min(3).max(20),
    BrandId: JoiObjectId().required(), 
  })
  .required();
// __________________________________________________________________________
const DeleteBrandValidData = joi
  .object({
    BrandId: JoiObjectId().required(),
  })
  .required();
// __________________________________________________________________________
module.exports = {
  BrandValidData,
  UpdateBrandValidData,
  DeleteBrandValidData,
};
