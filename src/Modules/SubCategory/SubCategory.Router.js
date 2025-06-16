const express = require("express");
const SubCategoryRouter = express.Router({ mergeParams: true });
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const { upload } = require("../../Utils/multer");
const {
  CreateSubCategoryValid,
  updateSubCategoryValid,
  DeleteSubCategoryValidData,
} = require("./SubCategory.validation.");
const {
  CreateSubCategory,
  updateSubCategory,
  DeleteSubCategory,
  ALLSubCategory,
} = require("./SubCategory.conntroller.");
// __________________________________________________________________________
// 1- create SubCategory
// http://localhost:3000/category/:categoryId/subcategory
SubCategoryRouter.post(
  "/",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("imagesubcategory"),
  isValid(CreateSubCategoryValid),
  CreateSubCategory
);
// __________________________________________________________________________
// 1- update SubCategory
// http://localhost:3000/category/:categoryId/subcategory/:subcategoryId
SubCategoryRouter.patch(
  "/:subcategoryId",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("imagesubcategory"),
  isValid(updateSubCategoryValid),
  updateSubCategory
);
// 1- Delete SubCategory
// http://localhost:3000/category/:categoryId/subcategory/:subcategoryId
SubCategoryRouter.delete(
  "/:subcategoryId",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("imagesubcategory"),
  isValid(DeleteSubCategoryValidData),
  DeleteSubCategory
);
// __________________________________________________________________________
// 1- Get All SubCategory
// http://localhost:3000/subcategory
SubCategoryRouter.get(
  "/",
  ALLSubCategory
);
// __________________________________________________________________________
module.exports = SubCategoryRouter;
