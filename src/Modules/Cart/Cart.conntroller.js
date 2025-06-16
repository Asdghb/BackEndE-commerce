const { asyncHandler } = require("../../Utils/asyncHandler");
const Product = require("../../../DB/Models/Product.models");
const Cart = require("../../../DB/Models/Cart.models");
const User = require("../../../DB/Models/User.models");
// __________________________________________________________________________
// add to cart
const AddToCart = asyncHandler(async (req, res, next) => {
  let { productId, quantity } = req.body;
  // تأكد من أن الكمية رقم صحيح
  quantity = parseInt(quantity);
  if (isNaN(quantity) || quantity <= 0) {
    return next(new Error("Invalid quantity value!", { cause: 400 }));
  }
  // التحقق من وجود المنتج
  const product = await Product.findById(productId);
  if (!product) {
    return next(new Error("Product Not Found!", { cause: 404 }));
  }
  // الحصول على العربة
  let cart = await Cart.findOne({ user: req.user._id });
  const productIdStr = productId.toString();
  if (!cart) {
    // تحقق من المخزون عند إنشاء العربة لأول مرة
    if (quantity > product.availableItems) {
      return next(
        new Error(
          `Sorry, only ${product.availableItems} items left in stock.`,
          { cause: 400 }
        )
      );
    }
    cart = await Cart.create({
      user: req.user._id,
      products: [{ productId, quantity }],
    });
  } else {
    const existingProduct = cart.products.find(
      (p) => p.productId.toString() === productIdStr
    );
    if (existingProduct) {
      const totalQuantity = existingProduct.quantity + quantity;

      if (totalQuantity > product.availableItems) {
        return next(
          new Error(
            `You can't add ${quantity} more items. Only ${
              product.availableItems - existingProduct.quantity
            } left in stock.`,
            { cause: 400 }
          )
        );
      }
      existingProduct.quantity = totalQuantity;
    } else {
      // تحقق قبل إضافة منتج جديد
      if (quantity > product.availableItems) {
        return next(
          new Error(
            `Sorry, only ${product.availableItems} items left in stock.`,
            { cause: 400 }
          )
        );
      }
      cart.products.push({ productId, quantity });
    }
    await cart.save();
  }
  return res.json({
    success: true,
    results: cart,
    message: "Product added to cart successfully!",
  });
});
// __________________________________________________________________________
// User Catr
const UserCart = asyncHandler(async (req, res, next) => {
  const UserCart = await Cart.findOne({ user: req.user._id }).populate(
    "products.productId",
    "name defaultImage.url price discount finalPrice"
  );
  return res.json({ success: true, results: UserCart });
});
// __________________________________________________________________________
// updateCart
const UpdateCart = asyncHandler(async (req, res, next) => {
  // date id , qty
  const { productId, quantity } = req.body;
  // check product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new Error("Product Not Found!", { cause: 404 }));
  }
  if (!product.inStock(quantity)) {
    return next(
      new Error(
        `Sorry, Only ${product.availableItems} items left on the stock...!`,
        { cause: 404 }
      )
    );
  }
  // update Cart
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, "products.productId": productId },
    { $set: { "products.$.quantity": quantity } },
    { new: true }
  );
  return res.json({ success: true, results: cart });
});
// __________________________________________________________________________
// Remove Cart
const RemoveProductCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  // tcheck user
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new Error("User Not Found!"));
  }
  // check produect cart
  const cart = await Cart.findOneAndUpdate(
    { user },
    { $pull: { products: { productId } } },
    { new: true }
  );
  return res.json({ success: true, results: cart });
});
// __________________________________________________________________________
// Clear To Cart
const ClearToCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { products: [] } },
    { new: true }
  );
  if (!cart) {
    return next(new Error("Cart not found!", { cause: 404 }));
  }
  return res.status(200).json({
    success: true,
    message: "Cart cleared successfully.",
    results: cart,
  });
});
// __________________________________________________________________________
module.exports = {
  AddToCart,
  UserCart,
  UpdateCart,
  RemoveProductCart,
  ClearToCart,
};
