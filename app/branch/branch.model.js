const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../utils/mongoose");
const autopopulate = require("mongoose-autopopulate");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
      trim: true,
    },
    address: {
      type: Object,
      // required: true,
   
    },
    branchCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    type:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
branchSchema.plugin(toJSON);
branchSchema.plugin(paginate);
branchSchema.plugin(autopopulate);

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
