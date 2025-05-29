const httpStatus = require('http-status');
const { Paper } = require('.'); // Assuming Paper model is exported from index.js
const Subject = require('../subject/subject.model'); // Adjust path as needed
const Grade = require('../grade/grade.model'); // Adjust path as needed
const Branch = require('../branch/branch.model'); // Adjust path as needed
const ApiError = require('../../utils/ApiError');
const { deleteFromS3 } = require('../../config/s3.file.system'); // Assuming S3 delete utility exists

/**
 * Helper to validate related entities for a paper
 */
const validatePaperEntities = async (paperBody) => {
  const { subjectId, gradeId, branchId } = paperBody;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject with ID ${subjectId} not found.`);
  }

  const grade = await Grade.findById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade with ID ${gradeId} not found.`);
  }

  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Branch with ID ${branchId} not found.`);
  }

  // Ensure all entities belong to the same branch (if applicable)
  if (subject.branchId.toString() !== branchId) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Subject ${subject.title} does not belong to branch ${branch.name}.`);
  }
  if (grade.branchId.toString() !== branchId) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Grade ${grade.title} does not belong to branch ${branch.name}.`);
  }
};

/**
 * Create a paper (upload paper)
 * @param {Object} paperBody - Basic paper data (title, subjectId, gradeId, etc.)
 * @param {ObjectId} userId - ID of the user uploading the paper (uploadedBy)
 * @param {string} fileUrl - URL of the uploaded paper file from S3
 * @returns {Promise<Paper>}
 */
const uploadPaper = async (paperBody, userId, fileUrl) => {
  await validatePaperEntities(paperBody);

  const paperData = {
    ...paperBody,
    paperFileUrl: fileUrl,
    uploadedBy: userId,
  };

  const paper = await Paper.create(paperData);
  return paper;
};

/**
 * Query for papers
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryPapers = async (filter, options) => {
  const { populate, ...restOptions } = options;
  
  let defaultPopulate = 'subjectId:title,gradeId:title,branchId:name,uploadedBy:fullname';
  if (populate) {
    defaultPopulate = populate;
  }

  let query = Paper.find(filter);

  if (restOptions.sortBy) {
    const sortingCriteria = [];
    restOptions.sortBy.split(',').forEach((sortOption) => {
      const [key, order] = sortOption.split(':');
      sortingCriteria.push((order === 'desc' ? '-' : '') + key);
    });
    query = query.sort(sortingCriteria.join(' '));
  } else {
    query = query.sort('-createdAt'); // Default sort
  }
  
  defaultPopulate.split(',').forEach((populateOption) => {
    const parts = populateOption.split(':');
    let path = parts[0];
    let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
    query = query.populate({ path, select });
  });

  const papers = await Paper.paginate(filter, restOptions, query);
  return papers;
};

/**
 * Get paper by id
 * @param {ObjectId} paperId
 * @param {String} populateOptions - Comma separated string of fields to populate
 * @returns {Promise<Paper>}
 */
const getPaperById = async (paperId, populateOptions) => {
  let query = Paper.findById(paperId);
  let defaultPopulate = 'subjectId gradeId branchId uploadedBy';
   if (populateOptions) {
    defaultPopulate = populateOptions;
  }

  defaultPopulate.split(',').forEach((populateOption) => {
    const parts = populateOption.split(':');
    let path = parts[0];
    let select = parts.length > 1 ? parts.slice(1).join(' ') : '';
    query = query.populate({ path, select });
  });
  return query.exec();
};

/**
 * Update paper by id
 * @param {ObjectId} paperId
 * @param {Object} updateBody
 * @param {ObjectId} userId - ID of the user performing the update
 * @param {string} [newFileUrl] - Optional new URL for the paper file
 * @returns {Promise<Paper>}
 */
const updatePaperById = async (paperId, updateBody, userId, newFileUrl) => {
  const paper = await getPaperById(paperId);
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }

  // If related entities are being updated, validate them
  if (updateBody.subjectId || updateBody.gradeId || updateBody.branchId) {
    const tempPaperBodyForValidation = {
        subjectId: updateBody.subjectId || paper.subjectId,
        gradeId: updateBody.gradeId || paper.gradeId,
        branchId: updateBody.branchId || paper.branchId,
    };
    await validatePaperEntities(tempPaperBodyForValidation);
  }
  
  const oldFileUrl = paper.paperFileUrl;
  Object.assign(paper, updateBody, { uploadedBy: userId }); // Update uploadedBy as well

  if (newFileUrl !== undefined) { // If a new file is provided (even if it's null to remove existing - though paperFileUrl is required)
    paper.paperFileUrl = newFileUrl;
    if (oldFileUrl && newFileUrl !== oldFileUrl) { // Delete old file if different from new one
      try {
        await deleteFromS3(oldFileUrl);
      } catch (s3Error) {
        console.error(`Failed to delete old paper file from S3: ${oldFileUrl}`, s3Error);
        // Decide if this should throw an error or just log
      }
    }
  } else if (updateBody.paperFileUrl === null && oldFileUrl) {
      // This case implies wanting to remove the file, but paperFileUrl is required.
      // This should ideally be prevented by validation or handled if the requirement changes.
      // For now, if newFileUrl is undefined, we don't change paperFileUrl unless explicitly set in updateBody.
      // If paperFileUrl is required, setting it to null here would cause a validation error on save.
      // The controller should ensure newFileUrl is provided if the file is meant to be replaced.
      // If paperFileUrl is made optional, this is where one might set it to null.
      // Given paperFileUrl is required, this block might be less relevant unless removing the file is a valid operation
      // and the schema changes.
  }


  await paper.save();
  return paper;
};

/**
 * Delete paper by id
 * @param {ObjectId} paperId
 * @returns {Promise<Paper>}
 */
const deletePaperById = async (paperId) => {
  const paper = await getPaperById(paperId);
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }

  const fileUrl = paper.paperFileUrl;
  await paper.remove(); // Remove from DB first

  if (fileUrl) {
    try {
      await deleteFromS3(fileUrl);
    } catch (s3Error) {
      console.error(`Failed to delete paper file from S3 during paper deletion: ${fileUrl}`, s3Error);
      // Log and continue as the DB entry is already removed.
    }
  }
  return paper;
};

module.exports = {
  uploadPaper,
  queryPapers,
  getPaperById,
  updatePaperById,
  deletePaperById,
};
