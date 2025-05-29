const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const router = express.Router();
const analyticsController = require("./analytics.controller");
const analyticsValidation = require("./analytics.validation");

router
    .route('/')
    .get( auth('manageDashboard'),analyticsController.dashboardQuery )
router
    .route('/monthly')
    .get( auth('manageDashboard'), validate(analyticsValidation.monthlyAnalytics), analyticsController.dashboardQueryFilter )
router
    .route('/ordersChart')
    .get( auth('manageDashboard'), validate(analyticsValidation.orderChart), analyticsController.ordersChart )

    router
    .route('/revenue')
    .get(auth('manageRevenue'),validate(analyticsValidation.revenue),analyticsController.revenue )
module.exports = router;
/**
 * @swagger
 * /analytics:
 *   get:
 *     summary: Get overall analytics
 *     description: Retrieve overall analytics data
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful response with analytics data
 *         content:
 *           application/json:
 *             example:
 *               productStats:
 *                 totalProducts: 172431
 *                 main: 97475
 *                 variant: 74956
 *                 active: 169898
 *                 inactive: 2423
 *               totalsales: 44855700
 *               totalUsers: 24849
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// router.route('/')
//     .get(auth('manageDashboard'), analyticsController.dashboardQuery);

/**
 * @swagger
 * /analytics/monthly:
 *   get:
 *     summary: Get monthly analytics
 *     description: Retrieve monthly analytics data
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         description: 2023-09-02
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       '200':
 *         description: Successful response with monthly analytics data
 *         content:
 *           application/json:
 *             example:
 *               products:
 *                 currMonthProducts: 3
 *                 prevMonthProducts: 13
 *               orders:
 *                 currMonthOrders:
 *                   confirmed: 3
 *                   delivered: 2
 *                   ready: 3
 *                   new: 70
 *                 prevMonthOrders:
 *                   ready: 2
 *                   delivered: 1
 *                   completed: 1
 *                   new: 68
 *                   cancel: 7
 *                   confirmed: 3
 *                 currMonthSales: 278075
 *                 prevMonthSales: 362320
 *                 currMonthTotalOrders: 70
 *                 prevMonthTotalOrders: 68
 *                 averageOrderValue: 3973
 *               users:
 *                 currMonthUsers:
 *                   user: 19
 *                   admin: 2
 *                   requestedSeller: 17
 *                   u: 1
 *                   supplier: 4
 *                 session:
 *                   null: 31
 *                   customer-app: 3
 *                   web-desktop: 8
 *                   seller-app: 1
 *                 currMonthTotalUsers: 43
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 */
// router.route('/monthly')
//     .get(auth('manageDashboard'), validate(analyticsValidation.monthlyAnalytics), analyticsController.dashboardQueryFilter);

/**
 * @swagger
 * /analytics/ordersChart:
 *   get:
 *     summary: Get orders chart data
 *     description: Retrieve data for orders chart
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         description: 2022-12-01
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         description: 2023-12-01
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         description: Format for the chart (day or month)
 *         schema:
 *           type: string
 *           enum: ['day', 'month']
 *     responses:
 *       '200':
 *         description: Successful response with orders chart data
 *         content:
 *           application/json:
 *             example:
 *               isSuccess: true
 *               status: 200
 *               data:
 *                 - x:
 *                     year: 2022
 *                     month: 11
 *                     date: 1
 *                   y: 55
 *                 - x:
 *                     year: 2022
 *                     month: 11
 *                     date: 2
 *                   y: 107
 *                 # ... (continue with other data points)
 *               message: Orders Chart
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 */
