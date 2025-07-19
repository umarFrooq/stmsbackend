const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose');

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['present', 'absent', 'leave', 'sick_leave', 'half_day_leave'],
    },
    remarks: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins
teacherAttendanceSchema.plugin(toJSON);
teacherAttendanceSchema.plugin(paginate);

teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

const TeacherAttendance = mongoose.model('TeacherAttendance', teacherAttendanceSchema);

module.exports = TeacherAttendance;
