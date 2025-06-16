
const Product = require("../../../DB/Models/Product.models");
const Category = require("../../../DB/Models/Category.models");
const { asyncHandler } = require("../../Utils/asyncHandler");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
// __________________________________________________________________________
// Create Product
const CreateProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    availableItems,
    price,
    discount,
    categoryId,
  } = req.body;
  const { nanoid } = await import("nanoid");
  const categoryid = await Category.findById(categoryId);
  if (!categoryid) {
    return next(new Error("not found categoryid!", { cause: 400 }));
  }
  if (!req.files || !req.files.Productimages || !req.files.defaultImage) {
    return next(new Error("Product images are required!", { cause: 400 }));
  }
  const cloudFolder = nanoid();
  let images = [];
  // upload multiple images and delete from server
  for (const file of req.files.Productimages) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.FOLDER_CLOUD_NAME}/products/${cloudFolder}`,
      }
    );
    images.push({ id: public_id, url: secure_url });
    // delete from local server
    fs.unlink(file.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  }
  // upload default image
  const { secure_url: defaultUrl, public_id: defaultId } =
    await cloudinary.uploader.upload(req.files.defaultImage[0].path, {
      folder: `${process.env.FOLDER_CLOUD_NAME}/products/${cloudFolder}`,
    });
  // delete default image from local server
  fs.unlink(req.files.defaultImage[0].path, (err) => {
    if (err) console.error("Error deleting default image file:", err);
  });
  const product = await Product.create({
    name,
    description,
    availableItems,
    price,
    discount,
    cloudFolder,
    createdBy: req.user._id,
    defaultImage: { url: defaultUrl, id: defaultId },
    images,
    categoryId,
  });
  return res.status(201).json({ success: true, results: product });
});
// __________________________________________________________________________
// delete
const DeleteProduct = asyncHandler(async (req, res, next) => {
  const ProductId = req.params.productId;
  // 1. التحقق من وجود المنتج
  const product = await Product.findById(ProductId);
  if (!product) {
    return next(new Error("Product Not Found!", { cause: 400 }));
  }
  // 2. التحقق من ملكية المستخدم للمنتج
  if (req.user._id.toString() !== product.createdBy.toString()) {
    return next(new Error("User Not Authorized!", { cause: 403 }));
  }
  // 3. حذف صور المنتج من Cloudinary
  for (const image of product.images) {
    if (image.id) {
      await cloudinary.uploader.destroy(image.id);
    }
  }
  // 4. حذف الصورة الافتراضية من Cloudinary
  if (product.defaultImage?.id) {
    await cloudinary.uploader.destroy(product.defaultImage.id);
  }
  // 5. حذف المجلد من Cloudinary
  await cloudinary.api.delete_folder(
    `${process.env.FOLDER_CLOUD_NAME}/products/${product.cloudFolder}`
  );
  // 6. حذف المنتج من قاعدة البيانات
  await Product.findByIdAndDelete(ProductId);
  // 7. الرد على العميل
  return res
    .status(200)
    .json({ success: true, message: "Product Deleted Successfully" });
});
// __________________________________________________________________________
// All Product search // محتاج دراسة دة
const GetAllProducts = asyncHandler(async (req, res, next) => {
  // ✅ 1. لو فيه categoryId في الرابط (مثلاً: /category/:categoryId/Product)
  if (req.params.categoryId) {
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return next(new Error("Category Id Not Found!", { cause: 400 }));
    }
    // ✅ إضافة limit هنا عشان نحدد عدد المنتجات الراجعة
    const limit = parseInt(req.query.limit) || 50; // ← العدد الافتراضي 50
    const product = await Product.find({
      categoryId: req.params.categoryId,
    }).limit(limit);
    return res.json({ success: true, results: product });
  }
  // ✅ 2. في حالة الوصول العام للمنتجات بدون categoryId
  // رابط مثل: /Product?page=1&sort=-price&fields=name&name=oppo&price=2000
  // فصل الفلاتر عن مفاتيح التحكم
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "fields", "limit"];
  excludedFields.forEach((field) => delete queryObj[field]);
  // إعداد pagination و limit
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  // تجهيز الاستعلام
  let query = Product.find(queryObj)
    .skip(skip)
    .limit(limit)
    .sort(req.query.sort || "-createdAt");
  // تحديد الأعمدة المراد عرضها
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  }
  // تنفيذ الاستعلام
  const products = await query;
  return res.json({ success: true, results: products });
});
// __________________________________________________________________________
// SingleProduct
const SingleProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productid).populate({
    path: "reviews",
    select: "content createdAt user",
    populate: { path: "user", select: "name" }, // عرض اسم المستخدم إن أردت
  });
  if (!product) {
    return next(new Error("Product Id Not Found!", { cause: 400 }));
  }
  return res.json({ success: true, results: product });
});
// __________________________________________________________________________
module.exports = {
  CreateProduct,
  DeleteProduct,
  GetAllProducts,
  SingleProduct,
};
