const mongoose = require("mongoose");
const ProductSchema = new mongoose.Schema(
  {
    reviews: [{ type: mongoose.Types.ObjectId, ref: "Reviews" }],
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 20,
    },
    description: String,
    images: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    defaultImage: {
      id: { type: String, required: true },
      url: { type: String, required: true },
    },
    availableItems: { type: Number, min: 1, required: true },
    soldItems: { type: Number, default: 0 },
    price: { type: Number, required: true },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
    SubCategoryId: {
      type: mongoose.Types.ObjectId,
      ref: "SubCategory",
    },
    BrandId: {
      type: mongoose.Types.ObjectId,
      ref: "Brand",
    },
    cloudFolder: { type: String, unique: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
ProductSchema.virtual("finalPrice").get(function () {
  if (this.price) {
    const discount = this.discount || 0;
    return Number.parseFloat(
      this.price - (this.price * discount) / 100
    ).toFixed(2);
  }
});
ProductSchema.methods.inStock = function (quantity) {
  return this.availableItems >= quantity;
};
const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
