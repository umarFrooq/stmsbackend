const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      autopopulate: { select: 'name code' },
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      autopopulate: { select: 'firstName lastName email' },
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
      autopopulate: { select: 'title levelCode' },
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      autopopulate: { select: 'name branchCode' },
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    lateSubmissionPenaltyPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      validate: {
        validator: function(v) {
          return !this.allowLateSubmission || (this.allowLateSubmission && v >= 0 && v <= 100);
        },
        message: 'Penalty percentage must be between 0 and 100 if late submissions are allowed.'
      }
    },
    fileAttachments: [
      {
        fileName: String,
        filePath: String,
        fileType: String,
      }
    ],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
    }
  },
  {
    timestamps: true,
  }
);

assignmentSchema.plugin(autopopulate);

assignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignmentId',
});

assignmentSchema.index({ schoolId: 1, gradeId: 1, subjectId: 1 });
assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ dueDate: 1 });

assignmentSchema.statics.isTitleTaken = async function (title, teacherId, subjectId, gradeId, excludeAssignmentId) {
  const query = { title, teacherId, subjectId, gradeId };
  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }
  const assignment = await this.findOne(query);
  return !!assignment;
};

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
