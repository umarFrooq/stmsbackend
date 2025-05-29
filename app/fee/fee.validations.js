const Joi = require('joi');
const { objectId } = require('../../utils/joi.custom.validation'); // Assuming this custom validation exists

const paymentMethodEnum = ['cash', 'card', 'online_banking', 'cheque', 'wallet', 'other'];
const feeStatusEnum = ['pending', 'partially_paid', 'paid', 'overdue', 'waived'];
const monthYearRegex = /^\d{4}-(0[1-9]|1[0-2])$/; // YYYY-MM

const paymentRecordSchema = Joi.object({
  // transactionId is not validated here as it might be generated or optional from client
  amountPaid: Joi.number().min(0).required(),
  paymentDate: Joi.date().iso().optional(), // Default is Date.now in model
  paymentMethod: Joi.string().valid(...paymentMethodEnum).optional(),
  remarks: Joi.string().trim().allow(null, ''),
  // recordedBy will be set by the system
});

const discountAppliedSchema = Joi.object({
  type: Joi.string().required().trim(),
  amount: Joi.number().min(0).required(),
  description: Joi.string().trim().allow(null, ''),
});

const createFee = {
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
    gradeId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    feeStructureId: Joi.string().custom(objectId).allow(null, ''), // Optional
    monthYear: Joi.string().regex(monthYearRegex).required()
        .messages({ 'string.pattern.base': 'monthYear must be in YYYY-MM format (e.g., 2023-07).' }),
    dueDate: Joi.date().iso().required(),
    totalAmount: Joi.number().min(0).required(),
    description: Joi.string().trim().allow(null, ''),
    discountApplied: discountAppliedSchema.optional(), // Discount can be applied at creation
    // paidAmount, remainingAmount, status are handled by model logic
    // paymentRecords are handled by separate endpoint
  }),
};

const getFees = {
  query: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
    gradeId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    monthYear: Joi.string().regex(monthYearRegex)
        .messages({ 'string.pattern.base': 'monthYear must be in YYYY-MM format (e.g., 2023-07).' }),
    status: Joi.string().valid(...feeStatusEnum),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(), // e.g., "studentId:fullname,gradeId:title"
  }),
};

const getFee = {
  params: Joi.object().keys({
    feeId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    populate: Joi.string(),
  }),
};

const updateFee = { // For general updates like description, discount, or waiving a fee
  params: Joi.object().keys({
    feeId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      description: Joi.string().trim().allow(null, ''),
      dueDate: Joi.date().iso(), // Allow updating due date
      totalAmount: Joi.number().min(0), // Allow updating total amount (e.g. corrections)
      discountApplied: discountAppliedSchema.allow(null), // Allow applying or changing discount, or removing by passing null
      status: Joi.string().valid('waived'), // Only allow 'waived' status to be set explicitly here
                                         // Other statuses are set by payment logic or cron jobs
      // feeStructureId can be added if it's updatable
    })
    .min(1),
};

const recordPayment = {
  params: Joi.object().keys({
    feeId: Joi.string().custom(objectId).required(),
  }),
  body: paymentRecordSchema, // Use the defined paymentRecordSchema
};

module.exports = {
  createFee,
  getFees,
  getFee,
  updateFee,
  recordPayment,
};
