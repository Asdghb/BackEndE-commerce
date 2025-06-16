const mongoose = require("mongoose");
const ReviewsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    content: {
      type: String,
      max: 200,
      required: true,
    },
  },
  { timestamps: true }
);
const Reviews = mongoose.model("Reviews", ReviewsSchema);
module.exports = Reviews;
