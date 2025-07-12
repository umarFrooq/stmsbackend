const httpStatus = require('http-status');
const Submission = require('./submission.model');
const Assignment = require('./assignment.model');
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick'); // Corrected from 'पानी' to 'pick'

/**
 * Create a new submission for an assignment
 * @param {ObjectId} assignmentId - ID of the assignment
 * @param {Object} submissionBody - Data for the submission (files, remarks)
 * @param {Object} student - The student user submitting
 * @returns {Promise<Submission>}
 */
const createSubmission = async (assignmentId, submissionBody, student) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found.');
  }
  if (assignment.status !== 'published') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This assignment is not currently accepting submissions.');
  }

  // Check if student's grade matches assignment's grade
  if (!student.gradeId || student.gradeId.toString() !== assignment.gradeId._id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You cannot submit to an assignment not intended for your grade.');
  }


  const now = new Date();
  let isLate = false;
  if (now > assignment.dueDate) {
    if (!assignment.allowLateSubmission) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Late submission is not allowed for this assignment.');
    }
    isLate = true;
  }

  // Check for existing submission by the same student for this assignment (model has unique index too)
  const existingSubmission = await Submission.findOne({ assignmentId, studentId: student._id });
  if (existingSubmission) {
    // Potentially allow resubmission if assignment settings permit and due date hasn't passed or late submission is allowed.
    // For now, strictly prevent re-submission.
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already submitted this assignment.');
  }

  const submissionPayload = {
    ...submissionBody,
    assignmentId,
    studentId: student._id,
    isLateSubmission: isLate,
    submissionDate: now,
    status: 'submitted',
  };

  return Submission.create(submissionPayload);
};

/**
 * Query for submissions
 * @param {Object} filterParams - Filter parameters from request query
 * @param {Object} options - Query options (limit, page, sortBy, populate)
 * @param {Object} user - The user making the request
 * @returns {Promise<QueryResult>}
 */
const querySubmissions = async (filterParams, options, user) => {
  const queryFilter = { ...filterParams };

  // Default sort order
  if (!options.sortBy) {
    options.sortBy = 'submissionDate:desc';
  }

  if (user.role === 'student') {
    queryFilter.studentId = user._id;
    // If assignmentId is provided by student, ensure it's valid for them (optional)
    if (filterParams.assignmentId) {
        const assignment = await Assignment.findById(filterParams.assignmentId);
        if (!assignment || assignment.gradeId.toString() !== user.gradeId.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, "You can only view submissions for assignments in your grade.");
        }
    }
  } else if (user.role === 'teacher') {
    // Teachers can view submissions for assignments they created or assignments in their school/branch/grade
    if (filterParams.assignmentId) {
        const assignment = await Assignment.findById(filterParams.assignmentId);
        if (!assignment || assignment.teacherId.toString() !== user._id.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to view submissions for this assignment.");
        }
    } else { // Teacher is querying generally, scope to their school
        const schoolAssignments = await Assignment.find({ schoolId: user.schoolId }).select('_id');
        const schoolAssignmentIds = schoolAssignments.map(a => a._id);
        if (schoolAssignmentIds.length === 0) {
             return { results: [], page: 1, limit: options.limit, totalPages: 0, totalResults: 0 };
        }
        queryFilter.assignmentId = { $in: schoolAssignmentIds };

        if(filterParams.gradeId){
            const gradeAssignments = await Assignment.find({ schoolId: user.schoolId, gradeId: filterParams.gradeId }).select('_id');
            const gradeAssignmentIds = gradeAssignments.map(a => a._id);
            queryFilter.assignmentId = { $in: [...queryFilter.assignmentId.$in, ...gradeAssignmentIds] }; // This logic might need refinement based on $in behavior
        }
    }
  } else if (user.role === 'admin' || user.role === 'branchAdmin' || user.role === 'rootUser') {
    let schoolContextId = user.schoolId; // For admin/branchAdmin
    if (user.role === 'rootUser' && filterParams.schoolId) {
        schoolContextId = filterParams.schoolId;
    } else if (user.role === 'rootUser' && !filterParams.schoolId) {
        schoolContextId = null; // Root user can see all if no schoolId filter
    }

    if (schoolContextId) {
        const assignmentsInSchool = await Assignment.find({ schoolId: schoolContextId }).select('_id');
        const assignmentIdsInSchool = assignmentsInSchool.map(a => a._id);
         if (assignmentIdsInSchool.length === 0) {
             return { results: [], page: 1, limit: options.limit, totalPages: 0, totalResults: 0 };
         }
        queryFilter.assignmentId = { $in: assignmentIdsInSchool };

        if (filterParams.branchId && (user.role === 'admin' || (user.role === 'branchAdmin' && user.branchId.toString() === filterParams.branchId))) {
            const assignmentsInBranch = await Assignment.find({ schoolId: schoolContextId, branchId: filterParams.branchId }).select('_id');
            queryFilter.assignmentId = { $in: assignmentsInBranch.map(a => a._id) };
        } else if (user.role === 'branchAdmin' && user.branchId) { // branchAdmin always scoped to their branch
             const assignmentsInBranch = await Assignment.find({ schoolId: schoolContextId, branchId: user.branchId }).select('_id');
            queryFilter.assignmentId = { $in: assignmentsInBranch.map(a => a._id) };
        }

        if(filterParams.gradeId){
            const assignmentsInGrade = await Assignment.find({ schoolId: schoolContextId, gradeId: filterParams.gradeId }).select('_id');
            const assignmentIdsInGrade = assignmentsInGrade.map(a => a._id);
            // Intersect with existing assignmentId filter if present
            if(queryFilter.assignmentId && queryFilter.assignmentId.$in){
                queryFilter.assignmentId.$in = queryFilter.assignmentId.$in.filter(id => assignmentIdsInGrade.includes(id));
            } else {
                queryFilter.assignmentId = { $in: assignmentIdsInGrade };
            }
        }
    }
    // If rootUser and no schoolId filter, no assignmentId restriction applied here, shows all submissions
    // (unless other filters like assignmentId or studentId are directly provided)

  } else {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view submissions.');
  }

  // Clean up filters that were used for intermediate assignment lookups but aren't direct Submission fields
  delete queryFilter.schoolId;
  delete queryFilter.gradeId;
  delete queryFilter.branchId;


  return Submission.paginate(queryFilter, options);
};

/**
 * Get submission by ID
 * @param {ObjectId} submissionId
 * @param {Object} user - The user making the request
 * @returns {Promise<Submission>}
 */
const getSubmissionById = async (submissionId, user, populateOptionsStr) => {
  let findQuery = Submission.findById(submissionId);

  if (populateOptionsStr) {
    populateOptionsStr.split(',').forEach(populateOption => {
        const [path, select] = populateOption.trim().split(':');
        if (select) { findQuery = findQuery.populate({ path, select }); }
        else { findQuery = findQuery.populate(path); }
    });
  }
  const submission = await findQuery.exec();

  if (!submission) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Submission not found.');
  }

  // Authorization checks
  if (user.role === 'student') {
    if (submission.studentId._id.toString() !== user._id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own submissions.');
    }
  } else if (user.role === 'teacher') {
    // Teacher must be associated with the assignment (either created it or in the same school)
    const assignment = await Assignment.findById(submission.assignmentId._id); // submission.assignmentId is populated
    if (!assignment || assignment.teacherId.toString() !== user._id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to view this submission.");
    }
  } else if (user.role === 'admin' || user.role === 'branchAdmin') {
    const assignment = await Assignment.findById(submission.assignmentId._id);
     if (!assignment || assignment.schoolId.toString() !== user.schoolId.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this submission.');
    }
    if (user.role === 'branchAdmin' && user.branchId && assignment.branchId.toString() !== user.branchId.toString()){
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this submission from another branch.');
    }
  } else if (user.role !== 'rootUser') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this submission.');
  }
  // rootUser can view any submission

  return submission;
};

/**
 * Grade a submission
 * @param {ObjectId} submissionId
 * @param {Object} gradeBody - Data for grading (obtainedMarks, teacherRemarks)
 * @param {Object} teacher - The teacher user grading
 * @returns {Promise<Submission>}
 */
const gradeSubmissionById = async (submissionId, gradeBody, teacher) => {
  const submission = await getSubmissionById(submissionId, teacher); // Ensures teacher has access

  // Further check: Only the teacher who created the assignment or a designated grader should grade.
  // The populated submission.assignmentId has teacherId.
  if (submission.assignmentId.teacherId._id.toString() !== teacher._id.toString()) {
      // Allow admin/rootUser to grade? Or other teachers in the same subject/grade?
      // For now, only the original assignment teacher.
      // More complex logic for co-teachers or admin grading can be added.
      if(!['admin', 'rootUser'].includes(teacher.role)){ // Admins/root can override
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only grade submissions for assignments you created.');
      }
  }

  if (gradeBody.obtainedMarks > submission.assignmentId.totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks cannot exceed total marks (${submission.assignmentId.totalMarks}).`);
  }

  // Apply late penalty if applicable
  let finalMarks = gradeBody.obtainedMarks;
  if (submission.isLateSubmission && submission.assignmentId.allowLateSubmission && submission.assignmentId.lateSubmissionPenaltyPercentage > 0) {
    const penalty = finalMarks * (submission.assignmentId.lateSubmissionPenaltyPercentage / 100);
    finalMarks -= penalty;
    finalMarks = Math.max(0, finalMarks); // Ensure marks don't go below 0
    // Add a remark about penalty?
    gradeBody.teacherRemarks = (gradeBody.teacherRemarks || "") +
        `\n(Late submission penalty of ${submission.assignmentId.lateSubmissionPenaltyPercentage}% applied.)`;
  }


  Object.assign(submission, {
      obtainedMarks: finalMarks,
      teacherRemarks: gradeBody.teacherRemarks,
      status: 'graded',
      gradedDate: new Date(),
      gradedBy: teacher._id,
  });

  await submission.save();
  return submission;
};


module.exports = {
  createSubmission,
  querySubmissions,
  getSubmissionById,
  gradeSubmissionById,
};
