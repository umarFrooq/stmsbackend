const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const payrollService = require('./payroll.service');
const pick = require('../../utils/pick');

const generatePayroll = catchAsync(async (req, res) => {
  const payroll = await payrollService.generatePayroll({
    ...req.body,
    schoolId: req.school.id,
    generatedBy: req.user.id,
  });
  res.status(httpStatus.CREATED).send(payroll);
});

const getPayrolls = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['teacherId', 'branchId', 'month', 'year', 'status']);
  filter.schoolId = req.school.id;
  if (req.user.role === 'teacher') {
    filter.teacherId = req.user.id;
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await payrollService.queryPayrolls(filter, options);
  res.send(result);
});

const getPayroll = catchAsync(async (req, res) => {
  const payroll = await payrollService.getPayrollById(req.params.payrollId);
  if (!payroll || payroll.schoolId.toString() !== req.school.id) {
    res.status(httpStatus.NOT_FOUND).send();
  } else {
    res.send(payroll);
  }
});

const updatePayroll = catchAsync(async (req, res) => {
  const payroll = await payrollService.updatePayrollById(req.params.payrollId, req.body);
  res.send(payroll);
});

const deletePayroll = catchAsync(async (req, res) => {
  await payrollService.deletePayrollById(req.params.payrollId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  generatePayroll,
  getPayrolls,
  getPayroll,
  updatePayroll,
  deletePayroll,
};
