const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    image: {
      url: { type: String, required: true },
      id: { type: String, required: true },
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
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
categorySchema.virtual("subcategoryid", {
  ref: "SubCategory",
  localField: "_id",
  foreignField: "categoryId",
});
const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
