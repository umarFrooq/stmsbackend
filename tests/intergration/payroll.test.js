const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { Payroll } = require('../../app/payroll');

setupTestDB();

describe('Payroll routes', () => {
  describe('POST /payrolls', () => {
    let newPayroll;

    beforeEach(() => {
      newPayroll = {
        teacher: '60c72b2f9b1e8a001f8e8b8a',
        school: '60c72b2f9b1e8a001f8e8b8b',
        branch: '60c72b2f9b1e8a001f8e8b8c',
        month: 1,
        year: 2022,
        basicSalary: 50000,
        netSalary: 50000,
      };
    });

    it('should return 201 and successfully create new payroll if data is ok', async () => {
      const res = await request(app).post('/payrolls').send(newPayroll).expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        id: expect.anything(),
        teacher: newPayroll.teacher,
        school: newPayroll.school,
        branch: newPayroll.branch,
        month: newPayroll.month,
        year: newPayroll.year,
        basicSalary: newPayroll.basicSalary,
        bonus: 0,
        deductions: 0,
        netSalary: newPayroll.netSalary,
        status: 'Unpaid',
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      });
    });
  });
});
