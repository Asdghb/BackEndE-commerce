const express = require("express");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const {
  CreateBrand,
  UpdateBrand,
  DeleteBrand,
  GetAllBrand,
} = require("./Brand.conntroller");
const {
  BrandValidData,
  UpdateBrandValidData,
  DeleteBrandValidData,
} = require("./Brand.validation");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const { upload } = require("../../Utils/multer");
const BrandRouter = express.Router();
// __________________________________________________________________________
// Create Brand 1
// http://localhost:3000/Brand
BrandRouter.post(
  "/",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("imageBrand"),
  isValid(BrandValidData),
  CreateBrand
);
// __________________________________________________________________________
// update Brand 2
// http://localhost:3000/Brand/:BrandId
BrandRouter.patch(
  "/:BrandId",
  isAuthentication,
  isAuthorized("admin"),
  upload.single("imageBrand"),
  isValid(UpdateBrandValidData),
  UpdateBrand
);
// __________________________________________________________________________
// delete Brand 3
// http://localhost:3000/Brand/:BrandId
BrandRouter.delete(
  "/:BrandId",
  isAuthentication,
  isAuthorized("admin"),
  isValid(DeleteBrandValidData),
  DeleteBrand
);
// __________________________________________________________________________
// Get All Brand
// http://localhost:3000/Brand/
BrandRouter.get("/", GetAllBrand);
// __________________________________________________________________________
module.exports = BrandRouter;
