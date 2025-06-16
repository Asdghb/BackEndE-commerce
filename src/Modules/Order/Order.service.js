const Cart = require("../../../DB/Models/Cart.models");
const Product = require("../../../DB/Models/Product.models");
// __________________________________________________________________________
const clearCart = async (userId) => {
  await Cart.findOneAndUpdate(
    { user: userId },
    { products: [] },
    { new: true }
  );
};
// __________________________________________________________________________
const UpdateStockProduct = async (products, placeOrder) => {
  for (const product of products) {
    const dbProduct = await Product.findById(product.productId);
    if (!dbProduct) continue;
    if (placeOrder) {
      // عند تنفيذ الطلب: خصم من المخزون وزيادة المبيعات
      await Product.findByIdAndUpdate(product.productId, {
        $inc: {
          availableItems: -product.quantity,
          soldItems: product.quantity,
        },
      });
    } else {
      // عند إلغاء الطلب: استرجاع الكمية بحذر
      const restoredStock = dbProduct.availableItems + product.quantity;
      const restoredSold = dbProduct.soldItems - product.quantity;
      await Product.findByIdAndUpdate(product.productId, {
        $set: {
          availableItems: restoredStock,
          soldItems: restoredSold < 0 ? 0 : restoredSold,
        },
      });
    }
  }
};
// __________________________________________________________________________
module.exports = { clearCart, UpdateStockProduct };
