const joi = require("joi");
// __________________________________________________________________________
// register valid Data
const registerData = joi
  .object({
    username: joi.string().min(3).max(20).required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    confirmPassword: joi
      .string()
      .valid(joi.ref("password"))
      .required()
      .messages({
        "any.only": "The confirm password does not match the password.",
        "string.empty": "Confirm password is required.",
      }),
  })
  .required();
// __________________________________________________________________________
//  login valid data
const LoginValid = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().required(),
    activationCode: joi.string().optional().allow(""), // <- مهم
  })
  .required();
// __________________________________________________________________________
// createActivationCodeV
const createActivationCodeV = joi
  .object({
    email: joi.string().email().required(),
  })
  .required();
// __________________________________________________________________________
module.exports = {
  registerData,
  LoginValid,
  createActivationCodeV,
};
