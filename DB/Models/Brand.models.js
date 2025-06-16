const mongoose = require("mongoose");
const BrandSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);
const Brand = mongoose.model("Brand", BrandSchema);
module.exports = Brand;
