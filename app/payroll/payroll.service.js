const { Payroll } = require('./payroll.model');

/**
 * Create a payroll
 * @param {Object} payrollBody
 * @returns {Promise<Payroll>}
 */
const createPayroll = async (payrollBody) => {
  const payroll = await Payroll.create(payrollBody);
  return payroll;
};

/**
 * Query for payrolls
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPayrolls = async (filter, options) => {
  const payrolls = await Payroll.paginate(filter, options);
  return payrolls;
};

/**
 * Get payroll by id
 * @param {ObjectId} id
 * @returns {Promise<Payroll>}
 */
const getPayrollById = async (id) => {
  return Payroll.findById(id);
};

/**
 * Update payroll by id
 * @param {ObjectId} payrollId
 * @param {Object} updateBody
 * @returns {Promise<Payroll>}
 */
const updatePayrollById = async (payrollId, updateBody) => {
  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payroll not found');
  }
  Object.assign(payroll, updateBody);
  await payroll.save();
  return payroll;
};

/**
 * Delete payroll by id
 * @param {ObjectId} payrollId
 * @returns {Promise<Payroll>}
 */
const deletePayrollById = async (payrollId) => {
  const payroll = await getPayrollById(payrollId);
  if (!payroll) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payroll not found');
  }
  await payroll.remove();
  return payroll;
};

module.exports = {
  createPayroll,
  queryPayrolls,
  getPayrollById,
  updatePayrollById,
  deletePayrollById,
};
