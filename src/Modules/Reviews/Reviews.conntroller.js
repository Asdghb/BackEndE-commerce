const Product = require("../../../DB/Models/Product.models");
const Reviews = require("../../../DB/Models/Reviews.models");
const { asyncHandler } = require("../../Utils/asyncHandler");
// __________________________________________________________________________
const AddReviews = asyncHandler(async (req, res, next) => {
  const { content, productId } = req.body;
  // 1. إنشاء مراجعة
  const review = await Reviews.create({
    user: req.user._id,
    productId: productId,
    content,
  });
  // 2. تحديث المنتج بإضافة المراجعة
  const product = await Product.findByIdAndUpdate(productId, {
    $push: { reviews: review._id },
  });
  if (!product) {
    return next(new Error("Product Not Found Id!"));
  }
  return res.json({
    success: true,
    message: "Review added successfully!",
    review,
  });
});
// __________________________________________________________________________
module.exports = { AddReviews };
