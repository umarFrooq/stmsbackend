const httpStatus = require('http-status');
const Submission = require('./submission.model');
const Assignment = require('./assignment.model');
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick');

const createSubmission = async (assignmentId, submissionBody, student) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Assignment not found.');
  }
  if (assignment.status !== 'published') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This assignment is not currently accepting submissions.');
  }

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

  const existingSubmission = await Submission.findOne({ assignmentId, studentId: student._id });
  if (existingSubmission) {
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

const querySubmissions = async (filterParams, options, user) => {
  const queryFilter = { ...filterParams };

  if (!options.sortBy) {
    options.sortBy = 'submissionDate:desc';
  }

  if (user.role === 'student') {
    queryFilter.studentId = user._id;
    if (filterParams.assignmentId) {
        const assignment = await Assignment.findById(filterParams.assignmentId);
        if (!assignment || assignment.gradeId.toString() !== user.gradeId.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, "You can only view submissions for assignments in your grade.");
        }
    }
  } else if (user.role === 'teacher') {
    if (filterParams.assignmentId) {
      const assignment = await Assignment.findById(filterParams.assignmentId);
      if (!assignment || assignment.teacherId.toString() !== user._id.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to view submissions for this assignment.");
      }
    } else {
      const teacherAssignments = await Assignment.find({ teacherId: user._id }).select('_id');
      const assignmentIds = teacherAssignments.map(a => a._id);
      if (assignmentIds.length === 0) {
          return { results: [], page: 1, limit: options.limit, totalPages: 0, totalResults: 0 };
      }
      queryFilter.assignmentId = { $in: assignmentIds };
    }
  } else if (user.role === 'admin' || user.role === 'branchAdmin' || user.role === 'rootUser') {
    let schoolContextId = user.schoolId;
    if (user.role === 'rootUser' && filterParams.schoolId) {
        schoolContextId = filterParams.schoolId;
    } else if (user.role === 'rootUser' && !filterParams.schoolId) {
        schoolContextId = null;
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
        } else if (user.role === 'branchAdmin' && user.branchId) {
             const assignmentsInBranch = await Assignment.find({ schoolId: schoolContextId, branchId: user.branchId }).select('_id');
            queryFilter.assignmentId = { $in: assignmentsInBranch.map(a => a._id) };
        }

        if(filterParams.gradeId){
            const assignmentsInGrade = await Assignment.find({ schoolId: schoolContextId, gradeId: filterParams.gradeId }).select('_id');
            const assignmentIdsInGrade = assignmentsInGrade.map(a => a._id);
            if(queryFilter.assignmentId && queryFilter.assignmentId.$in){
                queryFilter.assignmentId.$in = queryFilter.assignmentId.$in.filter(id => assignmentIdsInGrade.includes(id));
            } else {
                queryFilter.assignmentId = { $in: assignmentIdsInGrade };
            }
        }
    }
  } else {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view submissions.');
  }

  delete queryFilter.schoolId;
  delete queryFilter.gradeId;
  delete queryFilter.branchId;


  return Submission.paginate(queryFilter, options);
};

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

  if (user.role === 'student') {
    if (submission.studentId._id.toString() !== user._id.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own submissions.');
    }
  } else if (user.role === 'teacher') {
    const assignment = await Assignment.findById(submission.assignmentId._id);
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

  return submission;
};

const gradeSubmissionById = async (submissionId, gradeBody, teacher) => {
  const submission = await getSubmissionById(submissionId, teacher);

  if (submission.assignmentId.teacherId._id.toString() !== teacher._id.toString()) {
      if(!['admin', 'rootUser'].includes(teacher.role)){
        throw new ApiError(httpStatus.FORBIDDEN, 'You can only grade submissions for assignments you created.');
      }
  }

  if (gradeBody.obtainedMarks > submission.assignmentId.totalMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks cannot exceed total marks (${submission.assignmentId.totalMarks}).`);
  }

  let finalMarks = gradeBody.obtainedMarks;
  if (submission.isLateSubmission && submission.assignmentId.allowLateSubmission && submission.assignmentId.lateSubmissionPenaltyPercentage > 0) {
    const penalty = finalMarks * (submission.assignmentId.lateSubmissionPenaltyPercentage / 100);
    finalMarks -= penalty;
    finalMarks = Math.max(0, finalMarks);
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

const updateSubmissionById = async (submissionId, updateBody, user) => {
    const submission = await getSubmissionById(submissionId, user);

    if (updateBody.obtainedMarks !== undefined) {
        if (updateBody.obtainedMarks > submission.assignmentId.totalMarks) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Obtained marks cannot exceed total marks (${submission.assignmentId.totalMarks}).`);
        }
        submission.obtainedMarks = updateBody.obtainedMarks;
        submission.status = 'graded';
        submission.gradedDate = new Date();
        submission.gradedBy = user._id;
    }

    if (updateBody.teacherRemarks !== undefined) {
        submission.teacherRemarks = updateBody.teacherRemarks;
    }

    await submission.save();
    return submission;
};

module.exports = {
  createSubmission,
  querySubmissions,
  getSubmissionById,
  gradeSubmissionById,
  updateSubmissionById,
};
