const joi = require("joi");
// __________________________________________________________________________
// register valid Data
const registerData = joi
  .object({
    username: joi.string().min(3).max(20).required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required().messages({
      'any.only': 'The confirm password does not match the password.',
      'string.empty': 'Confirm password is required.',
    }),
  })
  .required();
  // __________________________________________________________________________
// activate Acount valid data
const activateAcount = joi
  .object({
    activationCode: joi.string().required(),
  })
  .required();
  // __________________________________________________________________________
//  login valid data
const LoginValid = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  })
  .required();
  // __________________________________________________________________________
  // forgetCode valid data
  const forgetcodeValid = joi.object({
    email:joi.string().email().required()
  }).required();
  // __________________________________________________________________________
  // reset password 
  const ResetPasswordValidData = joi.object({
    forgetCode:joi.string().required(),
    password:joi.string().required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required().messages({
      'any.only': 'The confirm password does not match the password.',
      'string.empty': 'Confirm password is required.',
    }),
  }).required()
  // __________________________________________________________________________
module.exports = { registerData, activateAcount, LoginValid , forgetcodeValid , ResetPasswordValidData};
