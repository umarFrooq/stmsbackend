const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { toJSON, paginate } = require("../../utils/mongoose");
// let mongoosepagination=require('mongoose-paginate-v2');
// const autopopulate = require("mongoose-autopopulate");
const qaSchema = new Schema(
  {
    productName: String,
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true},
    question: { type: String , trim: true,minlength: 1,maxlenth:300},
    answer: { type: String },
    visible: { type: Boolean,default:true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    brandName: { type: String },
    userName: { type: String },
    brandId: {
      type: mongoose.Types.ObjectId,
      ref: "SellerDetail",
      required: true,
    },
    sellerId: { type: mongoose.Types.ObjectId, ref: "User" },
    
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

qaSchema.plugin(toJSON);
qaSchema.plugin(paginate);
// qaSchema.plugin(autopopulate);
// qaSchema.plugin(mongoosepagination);
module.exports = mongoose.model("Q&A", qaSchema);
