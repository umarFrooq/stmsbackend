const httpStatus = require('http-status');
const { Fee } = require('.'); // Assuming Fee model is exported from index.js
const User = require('../user/user.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
// Fine model would be needed for applyFineToFee, e.g., const Fine = require('../fine/fine.model');

/**
 * Helper to validate related entities for fee creation/update against a given schoolId
 * @param {Object} feeBody - Contains studentId, gradeId, branchId
 * @param {ObjectId} schoolId - The schoolId to validate against
 */
const validateFeeEntities = async (feeBody, schoolId) => {
  const { studentId, gradeId, branchId } = feeBody;

  if (!schoolId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'School context is missing for validation.');
  }

  if (studentId) {
    const student = await User.findOne({ _id: studentId, schoolId });
    if (!student || !['student', 'user'].includes(student.role)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found in this school or is not a valid student.`);
    }
  }
  if (gradeId) {
    const grade = await Grade.findOne({ _id: gradeId, schoolId });
    if (!grade) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found in this school.`);
    }
  }
  if (branchId) {
    const branch = await Branch.findOne({ _id: branchId, schoolId });
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found in this school.`);
    }
     // Further check if grade and student belong to this branch (and thus this school)
    if (gradeId && studentId) {
        const grade = await Grade.findOne({ _id: gradeId, branchId, schoolId });
        if (!grade) throw new ApiError(httpStatus.BAD_REQUEST, `Grade does not belong to the specified branch in this school.`);
        const student = await User.findOne({ _id: studentId, branchId, schoolId }); // Assuming student has branchId
        if (!student) throw new ApiError(httpStatus.BAD_REQUEST, `Student does not belong to the specified branch in this school.`);
    }
  }
};

/**
 * Create a fee record
 * @param {Object} feeData - Data for the fee
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<Fee>}
 */
const createFee = async (feeData, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to create a fee record.');
  }
  await validateFeeEntities(feeData, schoolId);

  const feePayload = { ...feeData, schoolId };
  // The pre-save hook in the model will calculate remainingAmount and set initial status.
  try {
    const fee = await Fee.create(feePayload);
    return fee;
  } catch (error) {
     if (error.code === 11000 || (error.message && error.message.includes("duplicate key error")) ) {
       throw new ApiError(httpStatus.CONFLICT, 'A fee record with similar unique fields (e.g., studentId, monthYear for this school) might already exist.');
     }
     throw error;
  }
};

/**
 * Query for fee records
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {ObjectId} schoolId - The ID of the school
 * @returns {Promise<QueryResult>}
 */
const queryFees = async (filter, options, schoolId) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required to query fee records.');
  }
  const schoolScopedFilter = { ...filter, schoolId };

  // Assuming standard mongoose-paginate-v2 options.populate usage
  const fees = await Fee.paginate(schoolScopedFilter, options);
  return fees;
};

/**
 * Get fee record by id
 * @param {ObjectId} feeId - Fee ID
 * @param {ObjectId} schoolId - School ID
 * @param {String} [populateOptionsStr] - Comma-separated string for population
 * @returns {Promise<Fee>}
 */
const getFeeById = async (feeId, schoolId, populateOptionsStr) => {
  if (!schoolId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'School ID is required.');
  }
  let query = Fee.findOne({ _id: feeId, schoolId });

  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(popField => {
      const [path, select] = popField.trim().split(':');
      if (select) {
        query = query.populate({ path, select });
      } else {
        query = query.populate(path);
      }
    });
  } else { // Default population if not specified
    query = query.populate('studentId', 'fullname email')
                 .populate('gradeId', 'title')
                 .populate('branchId', 'name')
                 .populate('paymentRecords.recordedBy', 'fullname');
  }

  const fee = await query.exec();
  if (!fee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fee record not found or not associated with this school.');
  }
  return fee;
};

/**
 * Update fee details by id (e.g., add discount, waive, change description)
 * @param {ObjectId} feeId - Fee ID
 * @param {Object} updateBody - Data to update
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Fee>}
 */
const updateFeeById = async (feeId, updateBody, schoolId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  if (updateBody.schoolId && updateBody.schoolId.toString() !== schoolId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the school of a fee record.');
  }
  delete updateBody.schoolId;

  // If studentId, gradeId, or branchId are being changed, re-validate them.
  if (updateBody.studentId || updateBody.gradeId || updateBody.branchId) {
    const entitiesToValidate = {
        studentId: updateBody.studentId || fee.studentId,
        gradeId: updateBody.gradeId || fee.gradeId,
        branchId: updateBody.branchId || fee.branchId,
    };
    await validateFeeEntities(entitiesToValidate, schoolId);
  }

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
 * @param {ObjectId} feeId - Fee ID
 * @param {Object} paymentDetails - { amountPaid, paymentDate, paymentMethod, remarks }
 * @param {ObjectId} schoolId - School ID
 * @param {ObjectId} userId - User ID of the recorder
 * @returns {Promise<Fee>}
 */
const recordPayment = async (feeId, paymentDetails, schoolId, userId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  if (fee.status === 'paid' || fee.status === 'waived') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Fee is already ${fee.status}. No more payments can be recorded.`);
  }

  // Calculation logic for remaining amount and status is handled by pre-save hook in model.
  // Here, we just add the payment record and update paidAmount.
  
  const paymentRecord = {
    ...paymentDetails,
    recordedBy: userId, // This should be the currently logged-in user (e.g. admin, superadmin)
  };

  fee.paymentRecords.push(paymentRecord);
  fee.paidAmount += paymentDetails.amountPaid;
  // The pre-save hook in fee.model.js will recalculate remainingAmount and update status.
  await fee.save();
  return fee;
};

/**
 * Apply a fine to a fee record (Placeholder)
 * @param {ObjectId} feeId - Fee ID
 * @param {ObjectId} fineId - ID of the fine record
 * @param {ObjectId} schoolId - School ID
 * @returns {Promise<Fee>}
 */
const applyFineToFee = async (feeId, fineId, schoolId) => {
  const fee = await getFeeById(feeId, schoolId); // Ensures fee belongs to school

  // Validate that the fine also belongs to the same school
  // const FineModel = require('../fine/fine.model'); // Dynamic require or pass Fine model
  // const fine = await FineModel.findOne({_id: fineId, schoolId});
  // if (!fine) throw new ApiError(httpStatus.NOT_FOUND, 'Fine not found or does not belong to this school.');

  console.warn('applyFineToFee is a placeholder. Ensure fine validation against schoolId if implemented.');
  fee.fineApplied = fineId;
  await fee.save();
  return fee;
};

/**
 * Check for overdue fees and update their status (Placeholder for Cron Job)
 * This would typically be run by a scheduled task.
 * If this needs to be school-specific, it would require a schoolId parameter or iterate through schools.
 * For now, assuming it's a global check (might need adjustment for multi-tenancy).
 * @param {ObjectId} [schoolId] - Optional: to scope the check to a specific school
 * @returns {Promise<void>}
 */
const checkOverdueFees = async (schoolId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queryFilter = {
    dueDate: { $lt: today },
    status: { $in: ['pending', 'partially_paid'] },
  };

  if (schoolId) {
    queryFilter.schoolId = schoolId;
  }

  const overdueFees = await Fee.find(queryFilter);

  for (const fee of overdueFees) {
    fee.status = 'overdue';
    await fee.save();
  }
  console.log(`Checked and updated ${overdueFees.length} fees to 'overdue' ${schoolId ? `for school ${schoolId}` : 'globally'}.`);
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
