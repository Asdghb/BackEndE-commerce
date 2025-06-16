const express = require("express");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const {
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
  GetAllCategory,
} = require("./Category.conntroller");
const {
  CategoryValidData,
  UpdateCategoryValidData,
  DeleteCategoryValidData,
} = require("./Category.validation");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const { upload } = require("../../Utils/multer");
const SubCategoryRouter = require("../SubCategory/SubCategory.Router");
const ProductRouter = require("../Product/Product.Router");
const CategoryRouter = express.Router();
// __________________________________________________________________________
// http://localhost:3000/category/:categoryId/subcategory
CategoryRouter.use("/:categoryId/subcategory", SubCategoryRouter);
// __________________________________________________________________________
// http://localhost:3000/category/:categoryId/Product
CategoryRouter.use("/:categoryId/Product", ProductRouter);
// __________________________________________________________________________
// Create Category 1
// http://localhost:3000/category
CategoryRouter.post(
  "/",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("image"),
  isValid(CategoryValidData),
  CreateCategory
);
// __________________________________________________________________________
// update Category 2
// http://localhost:3000/category/:categoryId
CategoryRouter.patch(
  "/:categoryId",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("image"),
  isValid(UpdateCategoryValidData),
  UpdateCategory
);
// __________________________________________________________________________
// delete Category 3
// http://localhost:3000/category/:categoryId
CategoryRouter.delete(
  "/:categoryId",
  isAuthentication,
  isAuthorized("admin"),
  isValid(DeleteCategoryValidData),
  DeleteCategory
);
// __________________________________________________________________________
// Get All Category
// http://localhost:3000/category/
CategoryRouter.get("/", GetAllCategory);
// __________________________________________________________________________
module.exports = CategoryRouter;
