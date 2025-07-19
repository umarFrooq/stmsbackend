const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const leavePolicySchema = mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    paidLeavesPerMonth: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
leavePolicySchema.plugin(toJSON);
leavePolicySchema.plugin(paginate);

const LeavePolicy = mongoose.model('LeavePolicy', leavePolicySchema);

module.exports = LeavePolicy;
