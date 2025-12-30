const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videos: [{ type: String }], 
});

const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);
module.exports = Course;
