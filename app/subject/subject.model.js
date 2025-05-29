const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose");

const subjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creditHours: {
      type: Number,
      required: true,
      min: 0,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    defaultTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // We'll need to ensure this user has the 'teacher' role at the service level
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
subjectSchema.plugin(toJSON);
subjectSchema.plugin(paginate);

/**
 * Check if subjectCode is taken
 * @param {string} subjectCode - The subject's code
 * @param {ObjectId} [excludeSubjectId] - The id of the subject to be excluded
 * @returns {Promise<boolean>}
 */
subjectSchema.statics.isSubjectCodeTaken = async function (subjectCode, excludeSubjectId) {
  const subject = await this.findOne({ subjectCode, _id: { $ne: excludeSubjectId } });
  return !!subject;
};

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
