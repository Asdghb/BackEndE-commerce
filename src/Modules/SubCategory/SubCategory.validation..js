const joi = require("joi");
const JoiObject = require("joi-objectid")(joi);
// __________________________________________________________________________
// create valid
const CreateSubCategoryValid = joi
  .object({
    name: joi.string().min(5).max(20).required(),
    categoryId: JoiObject().required(),
  })
  .required();
// __________________________________________________________________________
// update valid
const updateSubCategoryValid = joi
  .object({
    name: joi.string().min(5).max(20),
    categoryId: JoiObject().required(),
    subcategoryId: JoiObject().required(),
  })
  .required();
// __________________________________________________________________________
// delete valid
const DeleteSubCategoryValidData = joi
  .object({
    categoryId: JoiObject().required(),
    subcategoryId: JoiObject().required(),
  })
  .required();
// __________________________________________________________________________
module.exports = {
  CreateSubCategoryValid,
  updateSubCategoryValid,
  DeleteSubCategoryValidData,
};
