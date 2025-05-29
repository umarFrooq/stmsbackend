const httpStatus = require('http-status');
const { Fee } = require('.'); // Assuming Fee model is exported from index.js
const User = require('../user/user.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
// Fine model would be needed for applyFineToFee, e.g., const Fine = require('../fine/fine.model');

/**
 * Helper to validate related entities for fee creation/update
 */
const validateFeeEntities = async (feeBody) => {
  const { studentId, gradeId, branchId } = feeBody;

  if (studentId) {
    const student = await User.findById(studentId);
    if (!student || !['student', 'user'].includes(student.role)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found or is not a valid student.`);
    }
  }
  if (gradeId) {
    const grade = await Grade.findById(gradeId);
    if (!grade) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found.`);
    }
  }
  if (branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found.`);
    }
  }
};

/**
 * Create a fee record
 * @param {Object} feeBody
 * @returns {Promise<Fee>}
 */
const createFee = async (feeBody) => {
  await validateFeeEntities(feeBody);
  // The pre-save hook in the model will calculate remainingAmount and set initial status.
  try {
    const fee = await Fee.create(feeBody);
    return fee;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) { // Check for unique index violation if any
       throw new ApiError(httpStatus.CONFLICT, 'A fee record with similar unique fields (e.g., studentId, monthYear) might already exist.');
     }
     throw error;
  }
};

/**
 * Query for fee records
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryFees = async (filter, options) => {
  const { populate, ...restOptions } = options;
  let defaultPopulate = 'studentId:fullname email,gradeId:title,branchId:name,paymentRecords.recordedBy:fullname';
  if (populate) {
    defaultPopulate = populate;
  }

  let query = Fee.find(filter);

  if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-monthYear -createdAt');
  }
  
  defaultPopulate.split(',').forEach(popField => {
    const [path, select] = popField.split(':');
    query = query.populate({ path, select });
  });

  const fees = await Fee.paginate(filter, restOptions, query);
  return fees;
};

/**
 * Get fee record by id
 * @param {ObjectId} feeId
 * @param {String} [populateOptions]
 * @returns {Promise<Fee>}
 */
const getFeeById = async (feeId, populateOptions) => {
  let query = Fee.findById(feeId);
  let defaultPopulate = 'studentId gradeId branchId paymentRecords.recordedBy';
  if (populateOptions) {
    defaultPopulate = populateOptions;
  }

  defaultPopulate.split(',').forEach(popField => {
    const [path, select] = popField.split(':');
    query = query.populate({ path, select });
  });

  const fee = await query.exec();
  if (!fee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fee record not found');
  }
  return fee;
};

/**
 * Update fee details by id (e.g., add discount, waive, change description)
 * @param {ObjectId} feeId
 * @param {Object} updateBody
 * @returns {Promise<Fee>}
 */
const updateFeeById = async (feeId, updateBody) => {
  const fee = await getFeeById(feeId); // Ensures fee exists

  // If totalAmount is being updated, ensure paidAmount doesn't exceed new total.
  // The pre-save hook will recalculate remaining and status.
  if (updateBody.totalAmount !== undefined && fee.paidAmount > updateBody.totalAmount) {
      if(!updateBody.discountApplied || (updateBody.discountApplied && fee.paidAmount > (updateBody.totalAmount - updateBody.discountApplied.amount)))
      throw new ApiError(httpStatus.BAD_REQUEST, 'New total amount cannot be less than the already paid amount considering discounts.');
  }

  // Apply discount: ensure discount doesn't make paid amount exceed effective total.
  if (updateBody.discountApplied && updateBody.discountApplied.amount !== undefined) {
    const effectiveTotal = (updateBody.totalAmount !== undefined ? updateBody.totalAmount : fee.totalAmount) - updateBody.discountApplied.amount;
    if (fee.paidAmount > Math.max(0, effectiveTotal)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Discount cannot be applied as paid amount would exceed new effective total.');
    }
  }


  Object.assign(fee, updateBody);
  await fee.save();
  return fee;
};

/**
 * Record a payment for a fee
 * @param {ObjectId} feeId
 * @param {Object} paymentDetails - { amountPaid, paymentDate, paymentMethod, remarks }
 * @param {ObjectId} userId - User ID of the recorder
 * @returns {Promise<Fee>}
 */
const recordPayment = async (feeId, paymentDetails, userId) => {
  const fee = await getFeeById(feeId);

  if (fee.status === 'paid' || fee.status === 'waived') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Fee is already ${fee.status}. No more payments can be recorded.`);
  }

  let totalDueAfterDiscount = fee.totalAmount;
  if (fee.discountApplied && fee.discountApplied.amount) {
    totalDueAfterDiscount -= fee.discountApplied.amount;
  }
  totalDueAfterDiscount = Math.max(0, totalDueAfterDiscount);

  if (fee.paidAmount + paymentDetails.amountPaid > totalDueAfterDiscount) {
    // Allow overpayment but log it or handle as per business rule. For now, just cap at totalDue.
    // Or, throw error:
    // throw new ApiError(httpStatus.BAD_REQUEST, `Payment exceeds remaining amount. Remaining: ${fee.remainingAmount}`);
    // For this implementation, we'll allow overpayment, but paidAmount in model will be capped by pre-save if needed.
    // Actually, better to adjust the payment or reject if strict.
    // For now, let's assume the pre-save hook will correctly set status to 'paid' and remaining to 0.
  }
  
  const paymentRecord = {
    ...paymentDetails,
    recordedBy: userId,
  };

  fee.paymentRecords.push(paymentRecord);
  fee.paidAmount += paymentDetails.amountPaid;
  // The pre-save hook will recalculate remainingAmount and update status.
  await fee.save();
  return fee;
};

/**
 * Apply a fine to a fee record (Placeholder)
 * @param {ObjectId} feeId
 * @param {ObjectId} fineId - ID of the fine record
 * @returns {Promise<Fee>}
 */
const applyFineToFee = async (feeId, fineId) => {
  const fee = await getFeeById(feeId);
  // This would involve fetching the Fine model, validating it,
  // and then potentially adjusting totalAmount or adding to a fines array on the fee.
  // For now, just linking it.
  // const fine = await Fine.findById(fineId);
  // if (!fine) throw new ApiError(httpStatus.NOT_FOUND, 'Fine not found');
  // fee.fineApplied = fineId; // Or add to an array of fines
  // fee.totalAmount += fine.amount; // Example if fine increases total
  // await fee.save();
  console.warn('applyFineToFee is a placeholder and not fully implemented.');
  fee.fineApplied = fineId; // Example direct link
  await fee.save();
  return fee;
};

/**
 * Check for overdue fees and update their status (Placeholder for Cron Job)
 * This would typically be run by a scheduled task.
 * @returns {Promise<void>}
 */
const checkOverdueFees = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare with start of day

  const overdueFees = await Fee.find({
    dueDate: { $lt: today },
    status: { $in: ['pending', 'partially_paid'] }, // Only these statuses can become overdue
  });

  for (const fee of overdueFees) {
    fee.status = 'overdue';
    // Potentially apply a fine here automatically if business rules dictate
    await fee.save();
  }
  console.log(`Checked and updated ${overdueFees.length} fees to 'overdue'.`);
};


module.exports = {
  createFee,
  queryFees,
  getFeeById,
  updateFeeById,
  recordPayment,
  applyFineToFee, // Placeholder
  checkOverdueFees, // Placeholder
};
