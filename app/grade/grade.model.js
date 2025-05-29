const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose"); // Assuming these utils exist
const autopopulate = require("mongoose-autopopulate");

const gradeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    levelCode: { // Optional code for the grade/level, e.g., "GR1", "GR2-ADV"
      type: String,
      unique: true, // Unique globally, but service layer will check uniqueness within branch
      sparse: true, // Allows multiple documents to have null for this field if not provided
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      autopopulate: { select: 'name branchCode' }, // Autopopulate branch name and code
    },
    sections: [
      {
        type: String,
        trim: true,
        uppercase: true, // Store section names in uppercase, e.g., "A", "B", "MORNING"
      },
    ],
    nextGradeId: { // For defining a sequence of grades, e.g., Grade 1 -> Grade 2
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade", // Self-reference to another Grade document
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Add plugins
gradeSchema.plugin(toJSON);
gradeSchema.plugin(paginate);
gradeSchema.plugin(autopopulate);

/**
 * Check if levelCode is taken within a specific branch
 * @param {string} levelCode - The grade's level code
 * @param {ObjectId} branchId - The ID of the branch
 * @param {ObjectId} [excludeGradeId] - The ID of the grade to be excluded (e.g., when updating)
 * @returns {Promise<boolean>}
 */
gradeSchema.statics.isLevelCodeTakenInBranch = async function (levelCode, branchId, excludeGradeId) {
  const query = { levelCode, branchId };
  if (excludeGradeId) {
    query._id = { $ne: excludeGradeId };
  }
  const grade = await this.findOne(query);
  return !!grade;
};

const Grade = mongoose.model("Grade", gradeSchema);

module.exports = Grade;
