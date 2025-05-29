const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const db = require("../../config/mongoose");
const Product = db.Product;
const SellerDetail = db.SellerDetail;
const ApiError = require("../../utils/ApiError");
const config = require('../../config/config');
const validator = require("validator");
const { toJSON, paginate } = require("../../utils/mongoose");
const { roles } = require("../../config/roles");
const bcrypt = require("bcryptjs");
const { verificationMethods, userTypes, newUserReward, roleTypes, originSource, gateWay } = require("../../config/enums");
const autopopulate = require("mongoose-autopopulate");
const en=require('../../config/locales/en')
const algoliasearch = require("algoliasearch");
const client = algoliasearch(config.algolia.algoliaApplicationId, config.algolia.algoliaWriteApiKey);
const index = client.initIndex("dev_Products");
const { slugGenerator ,dataTypeParser} = require("@/config/components/general.methods");
const userPaymentSchema = new Schema({
    paymentChanel: { type: String, enums: { ...Object.values(gateWay) } },
    customer: { type: String, select: false }
})
const socialShop = new Schema({
    pageId: String,
    businessId: String,
    catalogId: String
})
const {settValueParser}=require('../setting/setting.service')
// const userPaymentSchema = new Schema({
//     paymentChanel: { type: String, enums: { ...Object.values(gateWay) } },
//     customer: { type: String, select: false }
// })
const userSchema = new Schema({
    fullname: { type: String, required: false },
    email: {
        type: String,
        required: false,
        // unique: true,
        trim: true,
        lowercase: true,
        sparse: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('USER_MODULE.INVALID_EMAIL');
            }
        },
    },
    phone: {
        type: String,
        required: false,
        // unique: true,
        sparse: true,
        validate(value) {
            if (!validator.isMobilePhone(value)) {
                throw new Error('USER_MODULE.INVALID_MOBILE_NO');
            }
        },
        // private: true, // used by the toJSON plugin },

    },
    verificationMethod: {
        type: String,
        enum: [verificationMethods.SMS,
        verificationMethods.EMAIL, verificationMethods.GOOGLE,
        verificationMethods.FACEBOOK, verificationMethods.APPLE]

    },

    isEmailVarified: {
        type: Boolean,
        default: false,
    },
    isPhoneVarified: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
        required: false,
        trim: true,
        minlength: 8,
        validate(value) {
            if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                throw new Error(
                    'USER_MODULE.PASSWORD_MUST_BE_ALPHANUMERIC'
                );
            }
        },
        private: true, // used by the toJSON plugin
    },
    userType: {
        type: String,
        enum: [userTypes.LOCAL, userTypes.PHONE_NUMBER, userTypes.FACEBOOK, userTypes.GOOGLE, userTypes.APPLE],
        required: true,
        default: userTypes.LOCAL
    },
    role: {
        type: String,
        enum: roles,
        default: "user",
    },
    facebookId: { type: String, unique: true, sparse: true, },
    googleId: { type: String, unique: true, sparse: true, },
    defaultAddress: { type: Schema.Types.ObjectId, ref: 'Address', autopopulate: true },
    sellerDetail: { type: Schema.Types.ObjectId, ref: 'SellerDetail', autopopulate: true },
    appleId: { type: String, unique: true, sparse: true },
    origin: {
        source: { type: String },
        version: String
    },
    refCode: { type: String },
    wallet: {
        balance: { type: Number, default: 0 },
    },

    socialShop: socialShop,
    lang: { type: Object },

    lang:{type:Object},
    status: {
        type: String,
        enum: [userStatus.ACTIVE, userStatus.INACTIVE],
        default: "active",
    },
     payment: [userPaymentSchema],
    // paymentPlatform: [{ type: String, enums: { ...Object.values(gateWay) } }],
    // payment: [userPaymentSchema]
    agreement: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// userSchema.virtual('wallet', {
//     ref: 'Wallet',
//     localField: '_id',
//     foreignField: 'user', autopopulate: { maxDepth: 1 }
//   });

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId, role) {

    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};


userSchema.statics.isEmailTakenWithRole = async function (email, role) {

    const user = await this.findOne({ email, role });
    return !!user;
};

userSchema.statics.isPhoneTaken = async function (phone, excludeUserId) {
    const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
    return !!user;
};

userSchema.statics.isPhoneTakenWithRole = async function (phone, role) {
    const user = await this.findOne({ phone, role });
    return !!user;
};

userSchema.statics.isGoogleAccountTaken = async function (googleId, excludeUserId) {
    const user = await this.findOne({ googleId, _id: { $ne: excludeUserId } });
    return !!user;
};
userSchema.statics.isFacebookAccountTaken = async function (facebookId, excludeUserId) {
    const user = await this.findOne({ facebookId, _id: { $ne: excludeUserId } });
    return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    if (!user.isModified("refCode") && user.isNew) {
        user.refCode = slugGenerator(null, 5);
    }
    if (user.isNew && user.role === roleTypes.USER && user.origin && user.origin.source == originSource.app.customer)
       {

        let userReward= await settValueParser({key:"BALANCE"})
   
        user.wallet.balance = userReward.keyValue;
        // user.wallet.balance = newUserReward.balance;
    }
    next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
    const query = this.getQuery(); 
    const update = this.getUpdate();

    try {
        if (update.password) {
            update.password = await bcrypt.hash(update.password, 8);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// userSchema.pre("find", async function(next) {
//     const user = this;
//     if (user.isModified("password")) {
//         user.password = await bcrypt.hash(user.password, 8);
//     }
//     next();
// });
// userSchema.pre("remove", async function (next) {
//     const user = this;
//     if (user.role==="supplier"||user.role==="requestedSeller") {
//         //await Product.delete({user}).exec();
//         try {
//             const   products=await Product.find({user})
//             // await Product.deleteMany({_id: {$in: variants}}).exec();
//             let productsIds=[];
//             for (i = 0; i < products.length; i++) {
//              console.log(` from remove middleware: ${products[i]._id}`)
//              productsIds.push(products[i]._id.toString())
//              if (products[i].mainImage) {
//                await deleteFromS3(products[i].mainImage);
//              }
//              if (products[i].gallery.length > 0) {
//                await deleteFromS3(products[i].gallery);
//              }

//            }
//            await Product.deleteMany({_id: {$in: productsIds}}).exec()
//            console.log(productsIds)
//            index.deleteObjects(productsIds).then(({ objectIDs }) => 
//                 console.log(objectIDs) 
//           );
//           const   sellerDetail=await SellerDetail.find({seller:user._id})
//           if(sellerDetail){
//             if (sellerDetail.images.length > 0) {
//                 await deleteFromS3(sellerDetail.images);
//               }
//             await SellerDetail.deleteOne({seller:sellerDetail._id})

//           }

//           } catch (error) {
//             throw new ApiError(httpStatus.error.httpStatus, `${error}`);
//           }

//     }
//     next();

// });

// userSchema.virtual('addresses', {
//     ref: 'Address',
//     localField: '_id',
//     foreignField: 'user',
//     autopopulate: true
// });

// userSchema.virtual('Details', {
//     ref: 'SellerDetail',
//     localField: '_id',
//     foreignField: 'seller',
//     justOne: true,

//     autopopulate: true
//   });
// add plugin that converts mongoose to json
userSchema.plugin(autopopulate);
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Create a model
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;