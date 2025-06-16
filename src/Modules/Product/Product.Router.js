const express = require("express");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const {
  CreateProduct,
  DeleteProduct,
  GetAllProducts,
  SingleProduct,
} = require("./Product.conntroller");
const {
  ValidDateCreateProduct,
  ValidDataSingleProduct,
  ValidDataDeleteProduct,
} = require("./Product.validation");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const { upload } = require("../../Utils/multer");
const ProductRouter = express.Router({ mergeParams: true });
// __________________________________________________________________________
// Create Product
// http://localhost:3000/Product
ProductRouter.post(
  "/",
  isAuthentication,
  isAuthorized("admin"),
  upload.fields([
    { name: "defaultImage", maxCount: 1 }, // صورة واحدة
    { name: "Productimages", maxCount: 3 }, // صور متعددة
  ]),
  isValid(ValidDateCreateProduct),
  CreateProduct
);
// __________________________________________________________________________
// delete Product
// http://localhost:3000/Product/:productId
ProductRouter.delete(
  "/:productId",
  isAuthentication,
  isValid(ValidDataDeleteProduct),
  isAuthorized("admin"),
  DeleteProduct
);
// __________________________________________________________________________
// Get All Product
// http://localhost:3000/Product? // و ليها خصائص تانية
// http://localhost:3000/Product?page=1&sort=-price&fields=name&name=oppo&price=2000
// http://localhost:3000/category/:categoryId/Product
ProductRouter.get("/", GetAllProducts);
// __________________________________________________________________________
// single Product
// http://localhost:3000/Product/:productid
ProductRouter.get(
  "/:productid",
  isValid(ValidDataSingleProduct),
  SingleProduct
);
// __________________________________________________________________________
module.exports = ProductRouter;

