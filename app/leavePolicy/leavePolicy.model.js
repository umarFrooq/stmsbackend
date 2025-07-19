const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const leavePolicySchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    paidLeavesPerMonth: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
leavePolicySchema.plugin(toJSON);
leavePolicySchema.plugin(paginate);

leavePolicySchema.index({ schoolId: 1, branchId: 1 }, { unique: true });

const LeavePolicy = mongoose.model('LeavePolicy', leavePolicySchema);

module.exports = LeavePolicy;
