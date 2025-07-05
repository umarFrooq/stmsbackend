const mongoose = require('mongoose');
const { toJSON, paginate } = require('../../utils/mongoose'); // Adjust path if necessary based on final structure

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    schoolCode: {
      type: String,
      required: true,
      unique: true, // School codes should be unique
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_approval', 'suspended'],
      default: 'pending_approval',
      required: true,
    },
    type: {
      type: String,
      enum: ['public', 'private', 'charter', 'international', 'special_education', 'other'], // Example types
      required: false, // Making type optional for now
      trim: true,
    },
    address: { // Simple address for now, can be expanded or refactored to use Address model later
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    // Add other school-specific fields here later if needed
    // For example: contactPerson, phone, email, website, logoUrl etc.
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert Mongoose to JSON
schoolSchema.plugin(toJSON);
schoolSchema.plugin(paginate);

/**
 * Check if school name is taken
 * @param {string} name - The school's name
 * @param {ObjectId} [excludeSchoolId] - The id of the school to be excluded
 * @returns {Promise<boolean>}
 */
schoolSchema.statics.isNameTaken = async function (name, excludeSchoolId) {
  const school = await this.findOne({ name, _id: { $ne: excludeSchoolId } });
  return !!school;
};

const School = mongoose.model('School', schoolSchema);

module.exports = School;
