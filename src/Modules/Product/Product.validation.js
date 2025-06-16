const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
// __________________________________________________________________________
// CreateProduct
const ValidDateCreateProduct = Joi.object({
  name: Joi.string().required().min(2).max(20),
  description: Joi.string(),
  availableItems: Joi.number().min(1).required(),
  price: Joi.number().min(1).required(),
  discount: Joi.number().min(0).max(100).default(0),
  categoryId: Joi.objectId().required(),
}).required();
// __________________________________________________________________________
// DeleteProduct
const ValidDataDeleteProduct = Joi.object({
  productId: Joi.objectId().required(),
}).required();
// __________________________________________________________________________
// SingleProduct
const ValidDataSingleProduct = Joi.object({
  productid: Joi.objectId().required(),
}).required();
// __________________________________________________________________________
module.exports = {
  ValidDateCreateProduct,
  ValidDataSingleProduct,
  ValidDataDeleteProduct,
};
