const express = require('express');
const auth = require('../../middlewares/auth'); // Assuming auth middleware exists
const validate = require('../../middlewares/validate'); // Assuming validate middleware exists
const  branchController= require('./branch.controller')
const branchValidations  = require('./branch.validations'); // Assuming these are exported from index.js

const router = express.Router();

router
  .route('/')
  .post(auth('manageBranches'), validate(branchValidations.createBranch), branchController.createBranchHandler)
  .get(validate(branchValidations.getBranches), branchController.getBranchesHandler);

router
  .route('/:branchId')
  .get(validate(branchValidations.getBranch), branchController.getBranchHandler)
  .patch(auth('manageBranches'), validate(branchValidations.updateBranch), branchController.updateBranchHandler)
  .delete(auth('manageBranches'), validate(branchValidations.deleteBranch), branchController.deleteBranchHandler);

module.exports = router;
