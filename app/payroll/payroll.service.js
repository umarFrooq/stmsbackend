const httpStatus = require('http-status');
const Payroll = require('./payroll.model');
const TeacherAttendance = require('../teacherAttendance/teacherAttendance.model');
const LeavePolicy = require('../leavePolicy/leavePolicy.model');
const ApiError = require('../../utils/ApiError');

/**
 * Generate payroll
 * @param {Object} payrollBody
 * @returns {Promise<Payroll>}
 */
const generatePayroll = async (payrollBody) => {
  const { teacherId, schoolId, branchId, month, year, basicSalary, totalWorkingDays } = payrollBody;

  if (await Payroll.findOne({ teacherId, month, year })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payroll for this teacher for this month already exists.');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendances = await TeacherAttendance.find({
    teacherId,
    date: { $gte: startDate, $lte: endDate },
  });

  const presentDays = attendances.filter((a) => a.status === 'present').length;
  const absentDays = attendances.filter((a) => a.status === 'absent').length;

  const leavePolicy = await LeavePolicy.findOne({ schoolId, branchId });
  const paidLeavesPerMonth = leavePolicy ? leavePolicy.paidLeavesPerMonth : 0;

  const leavesTaken = attendances.filter((a) => a.status === 'leave' || a.status === 'sick_leave').length;
  const paidLeaves = Math.min(leavesTaken, paidLeavesPerMonth);
  const unpaidLeaves = leavesTaken - paidLeaves;

  const totalAbsentDays = absentDays + unpaidLeaves;

  const deductions = (totalAbsentDays * basicSalary) / totalWorkingDays;
  const netSalary = basicSalary - deductions;

  const payrollData = {
    ...payrollBody,
    presentDays,
    absentDays,
    paidLeaves,
    deductions,
    netSalary,
  };

  return Payroll.create(payrollData);
};

/**
 * Query for payrolls
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
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
  generatePayroll,
  queryPayrolls,
  getPayrollById,
  updatePayrollById,
  deletePayrollById,
};
