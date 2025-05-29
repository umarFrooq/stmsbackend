const httpStatus = require('http-status');
const { Fine } = require('.'); // Assuming Fine model is exported from index.js
const User = require('../user/user.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const Fee = require('../fee/fee.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');

/**
 * Helper to validate related entities for fine creation
 */
const validateFineEntities = async (fineBody) => {
  const { studentId, branchId, relatedFeeId } = fineBody;

  if (studentId) {
    const student = await User.findById(studentId);
    if (!student || !['student', 'user'].includes(student.role)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Student with ID ${studentId} not found or is not a valid student.`);
    }
  }
  if (branchId) {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found.`);
    }
  }
  if (relatedFeeId) {
    const fee = await Fee.findById(relatedFeeId);
    if (!fee) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Related Fee with ID ${relatedFeeId} not found.`);
    }
    // Optional: Check if studentId of fee matches studentId of fine
    if (fee.studentId.toString() !== studentId) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Related Fee's student does not match the fine's student.`);
    }
  }
};

/**
 * Issue a new fine
 * @param {Object} fineBody
 * @param {ObjectId} issuedByUserId
 * @returns {Promise<Fine>}
 */
const issueFine = async (fineBody, issuedByUserId) => {
  await validateFineEntities(fineBody);
  
  const fineData = {
    ...fineBody,
    issuedBy: issuedByUserId,
    status: 'pending', // Explicitly set default status
  };

  const fine = await Fine.create(fineData);
  return fine;
};

/**
 * Query for fines
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryFines = async (filter, options) => {
  const { populate, ...restOptions } = options;
  let defaultPopulate = 'studentId:fullname email,branchId:name,issuedBy:fullname,waivedBy:fullname,relatedFeeId:monthYear totalAmount';
  if (populate) {
    defaultPopulate = populate;
  }

  let query = Fine.find(filter);

  if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-createdAt');
  }
  
  defaultPopulate.split(',').forEach(popField => {
    const [path, selectFields] = popField.split(':');
    query = query.populate({ path, select: selectFields });
  });

  const fines = await Fine.paginate(filter, restOptions, query);
  return fines;
};

/**
 * Get fine by id
 * @param {ObjectId} fineId
 * @param {String} [populateOptions]
 * @returns {Promise<Fine>}
 */
const getFineById = async (fineId, populateOptions) => {
  let query = Fine.findById(fineId);
  let defaultPopulate = 'studentId branchId issuedBy waivedBy relatedFeeId';
  if (populateOptions) {
    defaultPopulate = populateOptions;
  }
  
  defaultPopulate.split(',').forEach(popField => {
    const [path, selectFields] = popField.split(':');
    query = query.populate({ path, select: selectFields });
  });

  const fine = await query.exec();
  if (!fine) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Fine record not found');
  }
  return fine;
};

/**
 * Update fine status (to 'paid' or 'waived')
 * @param {ObjectId} fineId
 * @param {Object} updateBody - Contains status, and conditional fields (paymentDate, paymentTransactionId, waiveReason)
 * @param {ObjectId} updatedByUserId - User performing the update (becomes waivedBy if status is 'waived')
 * @returns {Promise<Fine>}
 */
const updateFineStatus = async (fineId, updateBody, updatedByUserId) => {
  const fine = await getFineById(fineId);

  if (fine.status === 'paid' || fine.status === 'waived') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Fine is already ${fine.status} and cannot be updated.`);
  }

  if (updateBody.status === 'paid') {
    if (!updateBody.paymentDate) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment date is required when status is "paid".');
    }
    fine.status = 'paid';
    fine.paymentDate = updateBody.paymentDate;
    fine.paymentTransactionId = updateBody.paymentTransactionId; // Optional
    fine.waivedBy = undefined; // Clear waiver fields if previously set then changed
    fine.waiveReason = undefined;
  } else if (updateBody.status === 'waived') {
    if (!updateBody.waiveReason) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Waive reason is required when status is "waived".');
    }
    fine.status = 'waived';
    fine.waivedBy = updatedByUserId;
    fine.waiveReason = updateBody.waiveReason;
    fine.paymentDate = undefined; // Clear payment fields
    fine.paymentTransactionId = undefined;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status update. Must be "paid" or "waived".');
  }

  await fine.save();
  
  // Post-status update logic (e.g., if linked to a Fee)
  // if (fine.relatedFeeId && (fine.status === 'paid' || fine.status === 'waived')) {
  //   // At this point, the fine's impact on the Fee's `fineApplied` field or total amount
  //   // would be handled. For now, as per requirements, this is simplified.
  //   // The Fee model currently only has a link `fineApplied` and doesn't auto-adjust total.
  //   // If Fee's `fineApplied` should be cleared, it would be:
  //   // await Fee.findByIdAndUpdate(fine.relatedFeeId, { $unset: { fineApplied: "" } });
  //   // Or re-evaluate fee status if fine was part of its `totalAmount` (not the case now).
  // }

  return fine;
};

module.exports = {
  issueFine,
  queryFines,
  getFineById,
  updateFineStatus,
};
