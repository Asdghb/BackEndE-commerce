const Category = require("../../../DB/Models/Category.models");
const { asyncHandler } = require("../../Utils/asyncHandler");
const slugify = require("slugify");
const cloudinary = require("../../Utils/cloudinary");
const SubCategory = require("../../../DB/Models/SubCategory.models");
const uploadToCloudinary = require("../../Utils/uploadToCloudinary");
// __________________________________________________________________________
// Create Category
const CreateCategory = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const createdBy = req.user._id;

  if (!req.file) return next(new Error("Category image is required!"));

  console.log(req.file); // هل موجود؟

  // ⬅️ رفع مباشر من buffer
  const result = await uploadToCloudinary(
    req.file.buffer,
    `${process.env.FOLDER_CLOUD_NAME}/category`
  );

  const category = await Category.create({
    name,
    createdBy,
    image: {
      id: result.public_id,
      url: result.secure_url,
    },
    slug: slugify(name),
  });

  return res.status(201).json({ success: true, results: category });
});
// __________________________________________________________________________
// Update Category
const UpdateCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);
  if (!category) return next(new Error("Category Not Found!"));

  if (req.user._id.toString() !== category.createdBy.toString()) {
    return next(new Error("User Not Authorized!", { cause: 403 }));
  }

  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }

  if (req.file) {
    const uploadOptions = {};
    if (category.image && category.image.id)
      uploadOptions.public_id = category.image.id;

    // رفع الصورة الجديدة مباشرة من buffer مع استبدال القديمة إذا موجودة
    const result = await uploadToCloudinary(
      req.file.buffer,
      `${process.env.FOLDER_CLOUD_NAME}/category`,
      uploadOptions
    );

    category.image = {
      url: result.secure_url,
      id: result.public_id,
    };
  }

  await category.save();
  return res.json({ success: true, message: "Category updated successfully." });
});
// __________________________________________________________________________
// Delete Category
const DeleteCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);
  if (!category) return next(new Error("Category not found!"));

  // حذف الصورة من Cloudinary إذا كانت موجودة
  if (category.image && category.image.id) {
    await cloudinary.uploader.destroy(category.image.id, {
      resource_type: "image",
    });
  }

  // حذف الفئة من قاعدة البيانات
  await Category.deleteOne({ _id: categoryId });

  // حذف الـ SubCategories المرتبطة
  await SubCategory.deleteMany({ categoryId });

  res.json({ success: true, message: "Category deleted successfully!" });
});
// __________________________________________________________________________
// Get All Categories
const GetAllCategory = asyncHandler(async (req, res, next) => {
  const All_Category = await Category.find().populate({
    path: "subcategoryid",
    select: "name slug",
  });

  if (!All_Category || All_Category.length === 0) {
    return res.json({ success: true, results: All_Category });
  }

  return res.json({ success: true, results: All_Category });
});
// __________________________________________________________________________
module.exports = {
  CreateCategory,
  UpdateCategory,
  DeleteCategory,
  GetAllCategory,
};
