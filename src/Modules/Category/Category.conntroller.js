const Category = require("../../../DB/Models/Category.models");
const { asyncHandler } = require("../../Utils/asyncHandler");
const slugify = require("slugify");
const cloudinary = require("../../Utils/cloudinary");
const SubCategory = require("../../../DB/Models/SubCategory.models");
const fs = require("fs");
// __________________________________________________________________________
// create Category
const CreateCategory = asyncHandler(async (req, res, next) => {
  // data!
  const { name } = req.body;
  // user crated category!
  const createdBy = req.user._id;
  // check image file req!
  if (!req.file) {
    return next(new Error("Category image is requird!"));
  }
  // upload Cloudinary!
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `${process.env.FOLDER_CLOUD_NAME}/category` }
  );
  // delet image server!
  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.error("Error deleting the file from server:", err);
    }
  });
  // save db category!
  const category = await Category.create({
    name,
    createdBy,
    image: {
      id: public_id,
      url: secure_url,
    },
    slug: slugify(name),
  });
  console.log(category.id);
  // send res!
  return res.status(201).json({ success: true, results: category });
});
// __________________________________________________________________________
// Update Category
const UpdateCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  // التحقق من وجود التصنيف
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new Error("Category Not Found!"));
  }
  if (req.user._id.toString() !== category.createdBy.toString()) {
    return next(new Error("User Not Authorization!", { cause: 404 }));
  }
  // تحديث الاسم والسلاج إذا تم إرسالهما
  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }
  // تحديث الصورة إن تم رفع صورة جديدة
  if (req.file) {
    const uploadOptions = {};
    // إذا كانت هناك صورة قديمة، استبدلها
    if (category.image && category.image.id) {
      uploadOptions.public_id = category.image.id;
    }
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      uploadOptions
    );
    // تحديث أو إضافة الصورة
    category.image = {
      url: secure_url,
      id: public_id,
    };
  }
  // حفظ التعديلات في قاعدة البيانات
  await category.save();
  // إرسال الرد
  return res.json({ success: true, message: "Category updated successfully." });
});
// __________________________________________________________________________
// delete category
const DeleteCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  // التحقق من وجود الفئة
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new Error("Category not found!"));
  }
  // حذف الصورة من Cloudinary إذا كانت موجودة
  if (category.image.id) {
    const result = await cloudinary.uploader.destroy(category.image.id);
    console.log("Cloudinary delete result:", result);
  }
  // حذف الفئة من قاعدة البيانات
  await Category.deleteOne({ _id: categoryId });
  // delete Subcategorys
  await SubCategory.deleteMany({ categoryId });
  res.json({ success: true, message: "Category deleted successfully!" });
});
// __________________________________________________________________________
// Get All Category
const GetAllCategory = asyncHandler(async (req, res, next) => {
  const All_Category = await Category.find().populate("subcategoryid");
  if (!All_Category) {
    return next(new Error("Category Not Found Data!"));
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
