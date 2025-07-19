const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const payrollSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    totalWorkingDays: {
      type: Number,
      required: true,
    },
    presentDays: {
      type: Number,
      required: true,
    },
    absentDays: {
      type: Number,
      required: true,
    },
    paidLeaves: {
      type: Number,
      required: true,
    },
    deductions: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['paid', 'unpaid'],
      default: 'unpaid',
    },
    paidOn: {
      type: Date,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
payrollSchema.plugin(toJSON);
payrollSchema.plugin(paginate);

payrollSchema.index({ teacherId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
