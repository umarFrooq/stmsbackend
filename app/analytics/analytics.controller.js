const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const analyticsService = require("./analytics.service");

const dashboardQueryFilter = catchAsync(async (req, res) => {
    const result = await analyticsService.monthlyAnalytics(req.user,req.query.date, req.headers.authorization);
    res.status(httpStatus.OK).send(result);
  });

const dashboardQuery = catchAsync(async (req, res) => {
    const result = await analyticsService.overallAnalytics(req.user, req.headers.authorization);
    res.status(httpStatus.OK).send(result);
  });

const ordersChart = catchAsync(async (req, res) => {
    const result = await analyticsService.orderChart(req.user, req.query.startDate, req.query.endDate, req.query.format );
    res.status(httpStatus.OK).send(result);
  });
const revenue=async(req,res)=>{
  let result=await analyticsService.revenue(req.query)
res.sendStatus(result)
}

module.exports = {
  dashboardQueryFilter,
    dashboardQuery,
    ordersChart,
    revenue
}