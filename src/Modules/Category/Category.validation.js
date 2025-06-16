const joi = require("joi");
const JoiObjectId = require("joi-objectid")(joi); 
const CategoryValidData = joi
  .object({
    name: joi.string().min(3).max(20).required(),
  })
  .required();
// __________________________________________________________________________
const UpdateCategoryValidData = joi
  .object({
    name: joi.string().min(3).max(20),
    categoryId: JoiObjectId().required(), 
  })
  .required();
// __________________________________________________________________________
// delete category
const DeleteCategoryValidData = joi
  .object({
    categoryId: JoiObjectId().required(),
  })
  .required();
// __________________________________________________________________________
module.exports = {
  CategoryValidData,
  UpdateCategoryValidData,
  DeleteCategoryValidData,
};
