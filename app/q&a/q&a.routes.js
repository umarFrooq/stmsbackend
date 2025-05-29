const express = require("express");
const router = express.Router();
const qaController = require("./q&a.controller");
const auth = require("../../middlewares/auth");
const qaValidation = require("./qa.validation");
const validate = require("../../middlewares/validate");
router
  .route("/")
  .post(
    auth("manageQuestion"),
    validate(qaValidation.createQuestion),
    qaController.createQuestion
  )
  .get(validate(qaValidation.getAllQa), qaController.getAllQa);
router
  .route("/admin")
  .get(
    auth("manageQa"),
    validate(qaValidation.getAllAdminQA),
    qaController.getAllAdminQA
  );
router
  .route("/seller")
  .get(
    auth("manageAnswer"),
    validate(qaValidation.getAllSellerQA),
    qaController.getAllSellerQA
  );
router
  .route("/:id")
  .patch(
    auth("manageAnswer"),
    validate(qaValidation.createAnswer),
    qaController.createAnswer
  )
  .get(validate(qaValidation.getQAById), qaController.qaById)
  .delete(
    auth("manageQa"),
    validate(qaValidation.getQAById),
    qaController.deleteQa
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Q&A
 *   description: Questions and answer 
 */

/**
 * @swagger
 * /qa:
 *   post:
 *     summary: Create a new question
 *     description: Endpoint to create a new question.
 *     tags: [Q&A]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestion'
 *             example:
 *               productId: 60465a25e6ff0302c639e698
 *               question : Is there another color
 *     responses:
 *       201:
 *         description: Question created successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 visible: true
 *                 productId: "60465a25e6ff0302c639e698"
 *                 question: "Quality?"
 *                 productName: "Cars Carry Nests"
 *                 userId: "60b63b47de13d03759b7016f"
 *                 userName: "safi siddiqui"
 *                 brandName: "The Babies Store"
 *                 brandId: "60649f24e8f1d43f3746716e"
 *                 sellerId: "6045d047513d358144a144bf"
 *                 createdAt: "2024-02-06T05:35:33.894Z"
 *                 updatedAt: "2024-02-06T05:35:33.894Z"
 *                 __v: 0
 *                 id: "65c1c525e230ec0a30d818c9"
 *               message: "Question created"
 *       400:
 *         description: Bad request. Body not found.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Body not found."
 *               statusCode: 400
 */

/**
 * @swagger
 * /qa:
 *   get:
 *     summary: Get all questions
 *     description: Endpoint to retrieve all questions.
 *     tags: [Q&A]
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *         description: Filter by product name.
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by a specific field.
 *     responses:
 *       200:
 *         description: List of questions.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 totalResults: 7
 *                 results:
 *                   - question: "Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing"
 *                     brandId: "61b6f991719dc404d8f78202"
 *                     userId: "60b63b47de13d03759b7016f"
 *                     brandName: "supplier"
 *                     createdAt: "2022-11-25T05:44:53.465Z"
 *                     productId: {}
 *                     id: "63805655ed811619ac22c75e"
 *                   - question: "Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing"
 *                     brandId: "61b6f991719dc404d8f78202"
 *                     userId: "60b63b47de13d03759b7016f"
 *                     brandName: "supplier"
 *                     createdAt: "2022-11-25T05:44:42.767Z"
 *                     productId: {}
 *                     id: "6380564aed811619ac22c753"
 *                 page: 2
 *                 limit: 2
 *                 totalPages: 4
 *               message: "Question found"
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid parameters."
 *               statusCode: 400
 */

/**
 * @swagger
 * /qa/admin:
 *   get:
 *     summary: Get all admin questions
 *     description: Endpoint to retrieve all admin questions.
 *     tags: [Q&A]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *         description: Filter by product name.
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID.
 *       - in: query
 *         name: brandName
 *         schema:
 *           type: string
 *         description: Filter by brand name.
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         description: Filter by user name.
 *       - in: query
 *         name: limit
 *     responses:
 *       200:
 *         description: List of questions.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 totalResults: 7
 *                 results:
 *                   - question: "Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing"
 *                     brandId: "61b6f991719dc404d8f78202"
 *                     userId: "60b63b47de13d03759b7016f"
 *                     brandName: "supplier"
 *                     createdAt: "2022-11-25T05:44:53.465Z"
 *                     productId: {}
 *                     id: "63805655ed811619ac22c75e"
 *                   - question: "Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing"
 *                     brandId: "61b6f991719dc404d8f78202"
 *                     userId: "60b63b47de13d03759b7016f"
 *                     brandName: "supplier"
 *                     createdAt: "2022-11-25T05:44:42.767Z"
 *                     productId: {}
 *                     id: "6380564aed811619ac22c753"
 *                 page: 2
 *                 limit: 2
 *                 totalPages: 4
 *               message: "Question found"
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid parameters."
 *               statusCode: 400
 */
/**
 * @swagger
 * /qa/{id}:
 *   patch:
 *     summary: Create an answer for a question
 *     description: Endpoint to create an answer for a question.
 *     tags: [Q&A]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 65c1c525e230ec0a30d818c9.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnswer'
 *             example:
 *               
 *               answer : Yes
 *     responses:
 *       201:
 *         description: Question created successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 visible: true
 *                 productId: "60465a25e6ff0302c639e698"
 *                 question: "Quality?"
 *                 productName: "Cars Carry Nests"
 *                 userId: "60b63b47de13d03759b7016f"
 *                 userName: "safi siddiqui"
 *                 brandName: "The Babies Store"
 *                 brandId: "60649f24e8f1d43f3746716e"
 *                 sellerId: "6045d047513d358144a144bf"
 *                 createdAt: "2024-02-06T05:35:33.894Z"
 *                 updatedAt: "2024-02-06T05:35:33.894Z"
 *                 __v: 0
 *                 id: "65c1c525e230ec0a30d818c9"
 *               message: "Question created"
 *       400:
 *         description: Bad request. Body not found.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Body not found."
 *               statusCode: 400
 *   get:
 *     summary: Get a question by ID
 *     description: Endpoint to retrieve a question by its ID.
 *     tags: [Q&A]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the question to retrieve.
 *     responses:
 *       201:
 *         description: Question created successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 visible: true
 *                 productId: "60465a25e6ff0302c639e698"
 *                 question: "Quality?"
 *                 productName: "Cars Carry Nests"
 *                 userId: "60b63b47de13d03759b7016f"
 *                 userName: "safi siddiqui"
 *                 brandName: "The Babies Store"
 *                 brandId: "60649f24e8f1d43f3746716e"
 *                 sellerId: "6045d047513d358144a144bf"
 *                 createdAt: "2024-02-06T05:35:33.894Z"
 *                 updatedAt: "2024-02-06T05:35:33.894Z"
 *                 __v: 0
 *                 id: "65c1c525e230ec0a30d818c9"
 *               message: "Question created"
 *       400:
 *         description: Bad request. Body not found.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Body not found."
 *               statusCode: 400
 *   delete:
 *     summary: Delete a question by ID
 *     description: Endpoint to delete a question by its ID.
 *     tags: [Q&A]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the question to delete.
 *     responses:
 *       201:
 *         description: Question created successfully.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 visible: true
 *                 productId: "60465a25e6ff0302c639e698"
 *                 question: "Quality?"
 *                 productName: "Cars Carry Nests"
 *                 userId: "60b63b47de13d03759b7016f"
 *                 userName: "safi siddiqui"
 *                 brandName: "The Babies Store"
 *                 brandId: "60649f24e8f1d43f3746716e"
 *                 sellerId: "6045d047513d358144a144bf"
 *                 createdAt: "2024-02-06T05:35:33.894Z"
 *                 updatedAt: "2024-02-06T05:35:33.894Z"
 *                 __v: 0
 *                 id: "65c1c525e230ec0a30d818c9"
 *               message: "Question created"
 *       400:
 *         description: Bad request. Body not found.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Body not found."
 *               statusCode: 400
 */
/**
 * @swagger
 * /qa/seller:
 *   get:
 *     summary: Get all  questions by seller
 *     description: Endpoint to retrieve all questions.
 *     tags: [Q&A]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *         description: Filter by product name.
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID.
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         description: Filter by user name.
 *       - in: query
 *         name: limit
 *       
 *     responses:
 *       200:
 *         description: List of questions.
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               isSuccess: true
 *               data:
 *                 totalResults: 7
 *                 results:
 *                   - question: "Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing"
 *                     brandId: "61b6f991719dc404d8f78202"
 *                     userId: "60b63b47de13d03759b7016f"
 *                     brandName: "supplier"
 *                     createdAt: "2022-11-25T05:44:53.465Z"
 *                     productId: {}
 *                     id: "63805655ed811619ac22c75e"
 *                   - question: "Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing Testing"
 *                     brandId: "61b6f991719dc404d8f78202"
 *                     userId: "60b63b47de13d03759b7016f"
 *                     brandName: "supplier"
 *                     createdAt: "2022-11-25T05:44:42.767Z"
 *                     productId: {}
 *                     id: "6380564aed811619ac22c753"
 *                 page: 2
 *                 limit: 2
 *                 totalPages: 4
 *               message: "Question found"
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             example:
 *               error: "Bad Request"
 *               message: "Invalid parameters."
 *               statusCode: 400
 */