const mongoose = require("mongoose");
const SubCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 5, maxlength: 20 },
    slug: { type: String, required: true },
    image: {
      id: { type: String, required: true },
      url: { type: String, required: true },
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    BrandId: {
      type: mongoose.Types.ObjectId,
      ref: "Brand",
    },
  },
  { timestamps: true }
);
const SubCategory = mongoose.model("SubCategory", SubCategorySchema);
module.exports = SubCategory;
