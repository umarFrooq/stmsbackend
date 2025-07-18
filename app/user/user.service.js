
const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { deleteFromS3 } = require("../../config/upload-to-s3");
const User = db.User;
const Product = db.Product;
const SellerDetail = db.SellerDetail;
const SellerConfidentialDetail = db.SellerConfidentialDetail;
const config = require('../../config/config');
const algoliasearch = require("algoliasearch");
// const client = algoliasearch(config.algolia.algoliaApplicationId, config.algolia.algoliaWriteApiKey);
let mongoose= require('mongoose')
const addressService = require("../address/address.service");
const { sellerProfile, userProfile } = require("./profile");
const { sellerHome } = require("./sellerHome");
const { addressLocalTypes, transactionTypes, paymentMethods, roleTypes, indexes, codeTypes, voucherStatuses, userTypes } = require("@/config/enums");
const { slugGenerator, updateLangData } = require("@/config/components/general.methods");
const { createTransaction, creatTransactionSession } = require("../transaction/transaction.controller");
const { atlasSearchQueryParser, aggregationPagination, searchQuery, } = require("@/utils/generalDB.methods.js/DB.methods");
const { sortBy } = require("lodash");
const sortByParser = require("@/config/components/sortby.parser");
const en = require('../../config/locales/en')
const {usersearchQuery}=require('./user.query')
const {dateFilter,setAtasDateCondition}=require('../../config/components/general.methods');
const { sendEmailVerifemail } = require("../auth/email.service");
/**
 * Create a user
 * @param {Object} userBody - Data for the new user
 * @param {ObjectId} [schoolId] - Optional: The ID of the school if user is created within a school context
 * @returns {Promise<User>}
 */
const createUser = async (userBody, schoolId) => {
    // TODO: Determine if email uniqueness should be global or per school for certain roles.
    // For now, isEmailTakenWithRole is global for that role.
    // If a superadmin creates a user, that user should belong to their school.
    const schoolScopedRoles = ['student', 'teacher', 'admin', 'superadmin']; // Roles that should have a schoolId

    if (schoolId && schoolScopedRoles.includes(userBody.role)) {
        userBody.schoolId = schoolId;
        // Potentially, email uniqueness for these roles could be per school.
        // e.g., if (await User.isEmailTakenInSchool(userBody.email, userBody.role, schoolId))
        if (await User.isEmailTakenWithRole(userBody.email, userBody.role)) { // Current global check for role
             throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.EMAIL_ALREADY_TAKEN');
        }
    } else {
        // For users not scoped to a school (e.g. rootUser, or if schoolId not provided)
        if (await User.isEmailTakenWithRole(userBody.email, userBody.role)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.EMAIL_ALREADY_TAKEN');
        }
    }

    // Ensure branchId and gradeId are handled if they are required and not part of userBody
    // This was an issue noted when creating superadmin for a new school.
    // These fields might need to be optional in the User model or explicitly provided.
    if (schoolScopedRoles.includes(userBody.role) && schoolId) {
        if (!userBody.branchId && User.schema.paths.branchId.isRequired) {
            // This logic is complex: a new student/teacher needs a branch.
            // The calling controller/service needs to ensure branchId is provided and valid for the school.
            // For now, this service won't try to auto-assign it.
            // throw new ApiError(httpStatus.BAD_REQUEST, 'Branch ID is required for this user role.');
            console.warn(`User being created with role ${userBody.role} in school ${schoolId} might require a branchId.`);
        }
        if (!userBody.gradeId && User.schema.paths.gradeId.isRequired && (userBody.role === 'student' || userBody.role === 'teacher')) {
            // Similar for gradeId
            // throw new ApiError(httpStatus.BAD_REQUEST, 'Grade ID is required for this user role.');
            console.warn(`User being created with role ${userBody.role} in school ${schoolId} might require a gradeId.`);
        }
    }


    const user = await User.create(userBody);
    return user;
};

/**
 * Create a user (Requested Seller - seems specific, may not need schoolId directly unless sellers are per school)
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createRequestedSeller = async (userBody) => { // Assuming requestedSellers are not school-specific for now
    if (await User.isEmailTakenWithRole(userBody.email, "requestedSeller")) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.EMAIL_ALREADY_TAKEN');
    }
    if (await User.isPhoneTakenWithRole(userBody.phone, "requestedSeller")) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.PHONE_ALREADY_TAKEN');
    }
    userBody.role = "requestedSeller";
    userBody.isPhoneVarified = false;

    const user = await User.create(userBody);

    return user;
};

/**
 * Get user by id
 * @param {ObjectId} id - User ID
 * @param {ObjectId} [schoolId] - Optional: School ID to scope the search for non-root users
 * @returns {Promise<User>}
 */
const getUserById = async (id, schoolId) => {
    if (schoolId) { // If schoolId is provided, scope the search
        return User.findOne({ _id: id, schoolId });
    }
    return User.findById(id); // For rootUser or unscoped access
};
const getSellerProfile = async () => {
    return JSON.stringify(sellerProfile);
};
const getSellerHome = async () => {
    return JSON.stringify(sellerHome);
};

const getUserProfile = async () => {
    return JSON.stringify(userProfile);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
async function getUserByEmail(email) {
    return User.findOne({ email });

}

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
// const updateUserById = async (userId, updateBody) => {
//     const user = await getUserById(userId);
//     if (!user) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
//     }
//     const rolesToCheck = [roleTypes.ADMIN, roleTypes.REQUESTED_SUPPLIER, roleTypes.SUPPLIER];
//     const role = user.role == roleTypes.USER ? roleTypes.USER : { $in: rolesToCheck }
//     if (updateBody.email ) {
//         const existinngAccounts = await User.find({email:updateBody.email,role: role})
//         if (existinngAccounts && existinngAccounts.length > 0) {
//             googleAccounts = existinngAccounts.filter(account => account.userType == userTypes.GOOGLE)
//             phoneAccounts = existinngAccounts.filter(account => account.userType == userTypes.PHONE_NUMBER)
//             facebookAccounts = existinngAccounts.filter(account => account.userType == userTypes.FACEBOOK)
//             appleAccounts = existinngAccounts.filter(account => account.userType == userTypes.APPLE)

//             if(facebookAccounts.length > 0  && user.userType == userTypes.FACEBOOK){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//             }
//             if(googleAccounts.length > 0 && user.userType == userTypes.GOOGLE){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//             }
//             if(phoneAccounts.length > 0 && user.userType == userTypes.PHONE){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//             }
//             if(appleAccounts.length > 0 && user.userType == userTypes.APPLE){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//             }
          

//         }
//         else{
//             updateBody.email = updateBody.email.toLowerCase();
//             //verify email 
//         }
//     }
//     if (updateBody.phone) {
//         const existinngAccounts = await User.find({phone:updateBody.phone,role: role})
//         if (existinngAccounts && existinngAccounts.length > 0) {
//             googleAccounts = existinngAccounts.filter(account => account.userType == userTypes.GOOGLE)
//             phoneAccounts = existinngAccounts.filter(account => account.userType == userTypes.PHONE)
//             facebookAccounts = existinngAccounts.filter(account => account.userType == userTypes.FACEBOOK)
//             appleAccounts = existinngAccounts.filter(account => account.userType == userTypes.APPLE)

//             if(facebookAccounts.length > 0  && user.userType == userTypes.FACEBOOK){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "phone already taken");
//             }
//             if(googleAccounts.length > 0 && user.userType == userTypes.GOOGLE){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "phone already taken");
//             }
//             if(phoneAccounts.length > 0 && user.userType == userTypes.PHONE){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "phone already taken");
//             }
//             if(appleAccounts.length > 0 && user.userType == userTypes.APPLE){
//                 throw new ApiError(httpStatus.BAD_REQUEST, "phone already taken");
//             }
//         }
//         else{
//             updateBody.phone = updateBody.phone.toLowerCase();
//             //verify phone
//         }
//     }

//     if (updateBody.lang) {
//         updateBody.lang = updateLangData(updateBody.lang, user.lang);
//     }
//     // Object.assign(user, updateBody);
//     // await user.save();
//     return await User.findByIdAndUpdate(userId, updateBody, { new: true });
//     // return user;
// };

/**
 * Helper function to check if the email or phone is already taken for a given role and user type.
 * @param {Object} match - Object containing the field to check (e.g., { email: 'test@example.com' } or { phone: '1234567890' }).
 * @param {string} role - Role to check against (e.g., USER, ADMIN, SUPPLIER).
 * @param {string} currentUserType - User type of the current user (e.g., GOOGLE, FACEBOOK, APPLE, PHONE).
 */
const checkDuplication = async (match, role, currentUserType) => {
    const existingAccounts = await User.find({ ...match, role });
    if (!existingAccounts || existingAccounts.length === 0) return;
    const accountsMap = {
        [userTypes.GOOGLE]: existingAccounts.filter(acc => acc.userType === userTypes.GOOGLE),
        [userTypes.PHONE_NUMBER]: existingAccounts.filter(acc => acc.userType === userTypes.PHONE),
        [userTypes.FACEBOOK]: existingAccounts.filter(acc => acc.userType === userTypes.FACEBOOK),
        [userTypes.APPLE]: existingAccounts.filter(acc => acc.userType === userTypes.APPLE),
        [userTypes.LOCAL]: existingAccounts.filter(acc => acc.userType === userTypes.LOCAL),
    };
    if (accountsMap[currentUserType]?.length > 0) {
        const fieldName = Object.keys(match)[0]; // Get the field name (e.g., 'email' or 'phone')
        throw new ApiError(httpStatus.BAD_REQUEST, `${fieldName} already taken`);
    }
};

const updateUserById = async (userId, updateBody, schoolIdScope) => { // Added schoolIdScope
   try {
    const user = await getUserById(userId, schoolIdScope); // Use school-scoped getUserById if schoolIdScope is provided
    if (!user) {
        // If schoolIdScope was provided, this means user not found in that school
        const message = schoolIdScope ? 'User not found in your school or does not exist.' : 'User not found.';
        throw new ApiError(httpStatus.NOT_FOUND, message);
    }

    // Prevent schoolId modification through this service if it's not a root operation
    if (updateBody.schoolId && schoolIdScope && updateBody.schoolId.toString() !== schoolIdScope.toString()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot change user's school association through this update.");
    }
    if (updateBody.schoolId && !schoolIdScope) { // If a root user is trying to set/change schoolId
        // Ensure the new schoolId is valid (exists in Schools collection)
        const School = db.School; // Assuming School model is accessible via db
        if (!(await School.findById(updateBody.schoolId))) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid schoolId provided.');
        }
    }
    // If schoolIdScope is present, but updateBody.schoolId is not, ensure existing schoolId is not cleared
    // unless explicitly allowed (e.g. by passing null for schoolId if user can be unassigned from school).
    // For now, if schoolId is in updateBody, it's handled above. If not, user.schoolId remains.


    const rolesToCheck = [roleTypes.ADMIN, roleTypes.REQUESTED_SUPPLIER, roleTypes.SUPPLIER];
    // Role determination for duplication check needs to be based on the user's actual role, not hardcoded.
    const roleForDuplicationCheck = user.role === roleTypes.USER ? roleTypes.USER : user.role;

    if(updateBody.email && updateBody.email.toLowerCase() === user.email) delete updateBody.email;
    if(updateBody.phone && updateBody.phone === user.phone) delete updateBody.phone;
    
    if (updateBody.email) {
        updateBody.email = updateBody.email.toLowerCase();
        // TODO: checkDuplication might need schoolId if email/phone uniqueness is per school
        await checkDuplication({email:updateBody.email}, roleForDuplicationCheck, user.userType);
        // Email verification logic...
        let sixDigitCode = slugGenerator(undefined, 6, 'numeric', false, false, false);
        if (!sixDigitCode || !sixDigitCode.length)
          throw new ApiError(400, 'AUTH_MODULE.UNABLE_TO_CREATE_OTP');
        sendEmailVerifemail(updateBody.email, sixDigitCode, user.fullname);
        updateBody.isEmailVerified = false; // Note: user model uses isEmailVarified, but standard is isEmailVerified
    }

    if (updateBody.phone) {
        // TODO: checkDuplication might need schoolId
        await checkDuplication({phone:updateBody.phone}, roleForDuplicationCheck, user.userType);
        updateBody.isPhoneVerified = false; // Note: user model uses isPhoneVarified
    }

    if (updateBody.lang) {
        updateBody.lang = updateLangData(updateBody.lang, user.lang);
    }

    if (Object.keys(updateBody).length > 0) {
        return await User.findByIdAndUpdate(userId, { $set: updateBody }, { new: true });
    }
    else return user;
} catch(err) {
    // Ensure ApiError is thrown, not just generic error if checkDuplication throws non-ApiError
    if (err instanceof ApiError) throw err;
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
}
};

const updateProfile = async (user, userId, updateBody) => {
    if ((user.role != roleTypes.ADMIN) && (user.role !== roleTypes.ROOT_USER) && (user.id != userId)) { // rootUser can update any profile
        // If user is superadmin, they can only update profiles within their school.
        if (user.role === roleTypes.SUPERADMIN) {
            const targetUser = await getUserById(userId, user.schoolId);
            if (!targetUser) {
                 throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Cannot update users outside your school.");
            }
        } else {
            throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }
    // Pass schoolId if current user is superadmin, to ensure target user is within scope for updateUserById
    const schoolIdScope = user.role === roleTypes.SUPERADMIN ? user.schoolId : undefined;
    return await updateUserById(userId, updateBody, schoolIdScope);
}

const updateStatus = async (user, userId, updateBody) => { // This seems like self-status update
    if (user.id != userId) {
        // Potentially allow admin/superadmin/rootUser to change status of other users.
        // If superadmin, should be scoped.
        if (user.role === roleTypes.SUPERADMIN) {
            const targetUser = await getUserById(userId, user.schoolId);
            if (!targetUser) throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Cannot update status for users outside your school.");
        } else if (user.role !== roleTypes.ROOT_USER && user.role !== roleTypes.ADMIN) { // Assuming ADMIN is also somewhat global here
            throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }
    return await User.findByIdAndUpdate(userId, updateBody, { new: true });
};

const acceptRequestedSeller = async (userId) => { // Likely not school-scoped
    const user = await getUserById(userId); // Unscoped fetch, as this is usually a root/admin task
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
    }
    if (user.role !== "requestedSeller") {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.USER_NOT_REQUESTED_SELLER');
    }

    user.role = "supplier";
    await user.save();
    await SellerDetail.findOneAndUpdate({ seller: userId }, { approved: true });
    return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId - ID of the user to delete
 * @param {ObjectId} [requestingUserSchoolId] - Optional: School ID of the admin performing the delete
 * @param {string} [requestingUserRole] - Optional: Role of the admin performing the delete
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId, requestingUserSchoolId, requestingUserRole) => {
    let user;
    if (requestingUserRole === roleTypes.SUPERADMIN && requestingUserSchoolId) {
        user = await getUserById(userId, requestingUserSchoolId);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, 'User not found in your school or does not exist.');
        }
    } else { // For rootUser or other unscoped deletions
        user = await getUserById(userId);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
        }
    }

    // Existing logic for seller data deletion
    if (user.role === "supplier" || user.role === "requestedSeller") {

        // try {
        const products = await Product.find({ user })
        // await Product.deleteMany({_id: {$in: variants}}).exec();

        if (products.length > 0) {
            let productsIds = [];
            for (i = 0; i < products.length; i++) {
                productsIds.push(products[i]._id.toString())
                if (products[i].mainImage) {
                    deleteFromS3(products[i].mainImage);
                }
                if (products[i].gallery.length > 0) {
                    deleteFromS3(products[i].gallery);
                }

            }
            await Product.deleteMany({ _id: { $in: productsIds } }).exec()
        }

        const sellerDetail = await SellerDetail.findOne({ seller: user._id })
        if (sellerDetail) {
            if (sellerDetail.images.length > 0) {
                await deleteFromS3(sellerDetail.images);
            }
            await SellerDetail.deleteOne({ seller: user._id })

        }
        const sellerConfidentialDetail = await SellerConfidentialDetail.findOne({ seller: user._id })
        if (sellerConfidentialDetail) {
            if (sellerConfidentialDetail.cnicImages.length > 0) {
                await deleteFromS3(sellerConfidentialDetail.cnicImages);
            }
            await SellerConfidentialDetail.deleteOne({ seller: sellerConfidentialDetail._id })



        }

        //   } catch (error) {
        //     throw new ApiError(httpStatus.error.httpStatus, `${error}`);
        //   }

    }
    await user.remove();
    return user;
};

/**
 * Querying users with filter and options
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {ObjectId} [schoolId] - Optional: School ID to scope the query
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options, schoolId) => {
    let scopedFilter = { ...filter };
    if (schoolId) {
        scopedFilter.schoolId = schoolId;
    }
    // TODO: Further refine filter based on who is calling (e.g., superadmin should only see their school's users)
    // This might mean schoolId is not optional if the caller is not rootUser.
    // For now, if schoolId is provided, it's used.
    const users = await User.paginate(scopedFilter, options);
    return users;
};

/**
 * Querying users with filter and options (Sellers - likely not school-scoped)
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySellers = async (filter, options) => { // Assuming sellers are not school-specific
    Object.assign(filter, { role: "supplier" });
    const users = await User.paginate(filter, options);
    return users;
};

/**
 * Querying users with filter and options (Requested Sellers - likely not school-scoped)
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryRequestedSellers = async (filter, options) => { // Assuming requestedSellers are not school-specific
    Object.assign(filter, { role: "requestedSeller" });
    const users = await User.paginate(filter, options);
    return users;
};
/**
 * Default Address Update
 * @param {objectId} userId - userId of user to update its default address
 * @param {Object} addressBody - Incuding cartId,addressId
 * @returns {Promise<QueryResult>}
 */
const defaultAddress = async (userId, addressBody) => {
    const { cartInternationalShippment, getCartByUserId } = require("../cart/cart.service");
    // if (await User.isEmailTaken(userBody.email)) {
    //   throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    // }
    const address = await addressService.getAddressById(addressBody.addressId);
    if (!address) {
        throw new ApiError(httpStatus.NOT_FOUND, 'ADRESS_NOT_FOUND');
    }
    if (address.user.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
    }
    const user = await getUserById(userId);
    user.defaultAddress = addressBody.addressId;
    const cart = await getCartByUserId(userId);
    const defaultAddress = await user.save();
    if (cart && cart.packages) {
        console.log(defaultAddress);
        if (cart.id && defaultAddress.defaultAddress.localType == addressLocalTypes.INTERNATIONAL) {
            await cartInternationalShippment(addressBody.cartId, true);
        }
        else if (addressBody.addressId && defaultAddress.defaultAddress.localType == addressLocalTypes.LOCAL) {
            await cartInternationalShippment(addressBody.cartId, false);
        }
    }
    return user;
};

async function getUserByPhoneNumber(phone,customer=false) {
    let filter = {
        phone: phone
    }
    if(customer){
      filter.role  = 'user'
    }
    return await User.findOne(filter);
}
const createUserWithPhone = async (userBody) => {
    if (await User.isPhoneTaken(userBody.phone)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.PHONE_ALREADY_TAKEN');
    }
    const user = await User.create(userBody);
    return user;
};

const createUserWithGoogle = async (userBody) => {
    if (await User.isGoogleAccountTaken(userBody.id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.EMAIL_ALREADY_TAKEN');
    }
    const user = await User.create(userBody);
    return user;
};

const createUserWithFacebook = async (userBody) => {
    if (await User.isFacebookAccountTaken(userBody.fbId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.EMAIL_ALREADY_TAKEN');
    }
    const user = await User.create(userBody);
    return user;
};

const getUserByGoogleId = async (googleId) => {
    return await User.findOne({ googleId });
}

const getUserByfacebookId = async (facebookId) => {
    return await User.findOne({ facebookId });
}
const getUserPhone = async (user, userId) => {
    const userP = await getUserById(userId);
    if (!userP) {
        throw new ApiError(httpStatus.NOT_FOUND, 'USER_NOT_FOUND');
    }
    if (user.id !== userP.id && user.role !== "admin") {
        throw new ApiError(httpStatus.FORBIDDEN, 'FORBIDDEN');
    }
    if (!userP.phone) {

        throw new ApiError(httpStatus.NOT_FOUND, 'USER_MODULE.PHONE_NOT_FOUND');
    }


    const phone = userP.phone;


    return phone;
};

const isSeller = async (sellerId) => {
    return await User.findById({ _id: sellerId, role: "supplier" });
}

const changePassword = async (user, body) => {
    const { oldPassword, newPassword } = body;
    user = await getUserById(user.id);
    const bool = await user.isPasswordMatch(oldPassword);
    if (bool) {
        Object.assign(user, { password: newPassword });
        console.log(user);
        return await user.save();;
    }
    else throw new ApiError(httpStatus.FORBIDDEN, 'USER_MODULE.WRONG_PASSWORD');
}

/**
 * Create a OrderDetail
 * @param {String} refCode
 * @param {Object} cart 
 * @param {ObjectId} userId  
 * @returns {Promise<OrderDetail>}
 */
const getByRefCode = async (refCode, cart, userId) => {
    // try {
    const sellerDetailService = require("../sellerDetail/sellerDetail.service");
    const { voucherValidForCart } = require("../voucher/voucher.service");
    const { getCartByUser } = require("../cart/cart.service");

    // if cart not passed in params
    if (!cart) cart = await getCartByUser(userId);
    let validCode = false
    let refEnumValid = false;
    let type = null;

    // If num is valid
    let user = config.customRefCodes.includes(refCode);
    if (user) {
        type = codeTypes.CUSTOME_REF;
        return { status: 200, isSuccess: true, message: "ok", data: { type: codeTypes.CUSTOME_REF, user } }
    }

    // Validation for ref code
    user = await User.findOne({ refCode: refCode });
    if (user)
        return { status: 200, isSuccess: true, message: "ok", data: { type: codeTypes.REF, user } }

    // RRP validation
    if (!user) {
        user = await sellerDetailService.getByRRP(refCode);
    };

    // validation of rrp
    if (user) {
        let rrp;

        if (!cart || !cart.packages) return { status: 400, message: 'USER_MODULE.NO_PACKAGE_IN_CART', data: null, isSuccess: false }
        cart.packages.find(item => {
            if (item.seller && item.seller.sellerDetail && item.seller.sellerDetail.rrp == refCode) {
                rrp = {
                    rrpAmount: item.subTotal,
                    rrpValid: true, seller: item.seller.id, sellerDetail: item.seller.sellerDetail.id, rrp: refCode, customer: user.id
                }
            }
        })
        if (rrp)
            return {
                isSuccess: true,
                data: {
                    user: rrp,
                    type: codeTypes.RRP
                    // cart
                },
                message: "ok", status: 200
            }
    }

    // Voucher validation
    if (!user) {
        const voucher = await voucherValidForCart(refCode, cart, userId);
        // if(voucher && !voucher.isSuccess)
        return voucher
        // if (voucher && voucher.data)
        //     return voucher;

    }
    if (!type || !user)
        return { isSuccess: false, statu: 400, message: 'USER_MODULE.INVALID_RRP_REF_CODE_OR_VOUCHER', data: { type, user } };
    return { isSuccess: true, statu: 200, message: "", data: { type, user } };
    // } catch (err) {
    //     return { status: 400, message: err, data: null, isSuccess: false };
    // }
};


const updateRefCode = async (userId, body) => {
    if (userId && body && body.refCode) {
        user = await User.findByIdAndUpdate(userId, { refCode: body.refCode }, { new: true })
        if (!!user) return { status: 200, isSuccess: true, data: user, message: 'UPDATED' }
    }
    else return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.USER_OR_REF_CDE_MISSING' }
}

const adminDefaultAddress = async (data) => {
    if (data.userId && data.addressId) {
        // let addressBody = {cartId:data.cartId}
        return await defaultAddress(data.userId, data)
    } else throw new ApiError(400, 'USER_MODULE.USER_OR_ADDRESS_ID_MISSING')
}

/**
 * Add some amount in wallet
 * @param {Object} body - body includes userId,amount
 * @returns {Promise<QueryResult>} - Returns updated user
 */
const addOnWallet = async (body, session) => {
    if (typeof (body.amount) !== "number") return { status: 400, isSuccess: false, data: null, message: 'USER_MODLE.INVALID_AMOUNT' };
    const user = await User.findById(body.userId);
    if (user) {
        let updateAmount = { wallet: { balance: user.wallet ? user.wallet.balance + body.amount : body.amount } };
        const updateUser = await User.findByIdAndUpdate({ _id: body.userId }, updateAmount, { session });
        if (session)
            await creatTransactionSession({ userId: body.userId, amount: body.amount, method: paymentMethods.WALLET, type: transactionTypes.CREDIT, description: body.description ? body.description : "Added on wallet" }, session)
        else await createTransaction({ userId: body.userId, amount: body.amount, method: paymentMethods.WALLET, type: transactionTypes.CREDIT, description: body.description ? body.description : "Added on wallet",addOnType :body.addOnType })
        return { status: 200, isSuccess: true, data: updateUser, message: "Amount added successfully" };
    }
    else return { status: 400, isSuccess: false, data: null, message: 'USER_MODULE.USER_NOT_FOUND' };
}

const updateWalletPin = async (user, body) => {
    let { enabled, oldPin, newPin, confirmPin } = body;
    let _user = await User.findById(user._id);
    wallet = _user.wallet;
    if (newPin) {
        if (!_user.wallet.pin) return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.USER_HAS_NOT_SET_PIN' };
        if (_user.wallet.pin === oldPin) {
            ''
            if (newPin === confirmPin) {
                wallet.pin = newPin
            }
            else return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.WRONG_CONFIRM_PIN' };
        }
        else return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.WRONG_OLD_PIN' };
    }
    if (enabled !== undefined) {
        wallet.enabled = enabled;
    }
    result = await User.findByIdAndUpdate(user._id, { wallet }, { new: true });
    return { status: 200, isSuccess: true, data: result, message: 'USER_MODULE.WALLET_UPDATED' };

}

const createWalletPin = async (user, body) => {
    let { pin, confirmPin } = body;
    if (pin !== confirmPin) {
        return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.INCORRECT_PIN' };
    }
    let _user = await User.findById(user._id);
    if (_user && _user.wallet.enabled) {
        if (_user.wallet.pin) return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.USER_HAS_ALREADY_SET_PIN' };
        return { status: 200, isSuccess: false, data: {}, message: 'USER_MODULE.USER_HAS_ALREADY_ENABLED_PIN' };
    }
    let updateBody = { wallet: { balance: _user.wallet ? _user.wallet.balance : 0, enabled: true, pin: pin } };
    let result = await User.findByIdAndUpdate(user._id, updateBody, { new: true });
    return { status: 200, isSuccess: false, data: result, message: 'USER_MODULE.PIN_UPDATED' };
}

const updateBulkRefCode = async () => {
    const users = await User.find({ refCode: { $exists: false } });
    for (let i = 0; i < users.length; i++) {
        user = users[i];
        let refCode = slugGenerator(null, 5, "alphanumeric", true, false)
        user.refCode = refCode;
        user.save();
    }
    return { status: 200, success: true, data: {}, message: 'USER_MODULE.REF_CODE_UPDATED' };
}

/**
 * Get users by email and role
 * @param {string} email
 * @param {string} role
 * @returns {Promise<User>}
 */
async function getUserByEmailAndRole(email, ) {
    return User.findOne({ email});

}

const findOneUser = async (query) => {
    return await User.findOne(query)
}

/**
 * Query for Users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {Object} search - search params like {name:"", value:""}
 * @param {Query} project - mongo projection query
 * @param {Query} lookUp - mongo lookup query
 * @returns {Promise<QueryResult>}
 **/

const userSearch = (filter, options, search, project, lookUp, additionalquery) => {
    let filterSearch;
    // search parsing for search
    if (search && search.name && search.value) {

        filterSearch = searchQuery({ indexName: indexes.users.search.indexName, propertyName: indexes.users.search.propertyName }, search.value);
    }
    // Query parsing for search
    return atlasSearchQueryParser(filter, options, filterSearch, project, lookUp, additionalquery);
}

/**
 * Query for Users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */

const getAllUsers = async (filter, options, search) => {
    // Sorting 
    let userLookup = {};
    let userUnwind = {};
    let additionalquery = []
    options = sortByParser(options, { 'createdAt': -1 });
    if (filter && Object.keys(filter).length <= 0 || filter.role == roleTypes.USER || filter.role == undefined) {
        filter["role"] = roleTypes.USER;
        userLookup = {
            '$lookup': {
                'from': 'addresses',
                'localField': 'defaultAddress',
                'foreignField': '_id',
                'as': 'address'
            }
        }

        userUnwind = {
            '$unwind': {
                'path': '$address',
                'preserveNullAndEmptyArrays': true
            }
        }
        additionalquery = [userLookup, userUnwind]
    } else {
        userLookup = {
            '$lookup': {
                'from': 'sellerdetails',
                'localField': '_id',
                'foreignField': 'seller',
                'as': 'address'
            }
        }

        userUnwind = {
            '$unwind': {
                'path': '$address',
                'preserveNullAndEmptyArrays': true
            }
        }
        additionalquery = [userLookup, userUnwind]
    }

    if (filter.city) {
        additionalquery.push({
            '$match': { 'address.city': filter.city }
        })
        delete filter.city;
    }



    // Date filters and validations
    const { to, from } = filter;
    if (to && to.getTime() > new Date().getTime())
        throw new ApiError(400, 'TO_DATE_CANNOT_BE_GREATER_THAN_TODATE');
    if (from && from.getTime() > new Date().getTime())
        throw new ApiError(400, 'TO_DATE_CANNOT_BE_GREATER_THAN_TODATE');
    if (to && from && to.getTime() < from.getTime())
        throw new ApiError(400, 'FROM_DATE_CANNOT_BE_GREATER_THAN_TODATE');
    if (to && from) {
        Object.assign(filter, { createdAt: { $gte: from, $lte: to } });
    } else if (to && !from) {
        Object.assign(filter, { createdAt: { $lte: to } });
    } else if (!to && from) {
        Object.assign(filter, { createdAt: { $gte: from } });
    }
    delete filter.to;
    delete filter.from;
    // End Date filters and validations

    // Projection of required fields
    const project = {
        id: "$_id",
        _id: 0,
        fullname: 1,
        email: 1,
        role: 1,
        phone: 1,
        verificationMethod: 1,
        origin: 1,
        address: {
            address: 1,
            city: 1
        },
        wallet: 1
    };
    // Get final agregation pipeline
    const query = userSearch(filter, options, search, project, undefined, additionalquery);
    // Execution of query
    if (query) {
        const result = await aggregationPagination(User, query.query, query.options, query.facetFilter);
        if (result && result.isSuccess)
            return result.data
        else throw new ApiError(result.status, result.message);
    } else throw new ApiError(500, 'SOME_THING_WENT_WRONG_TRY_LATER');
}

const changePasswordAdmin = async (user, body) => {
    const { newPassword, userId } = body;
    if (!newPassword) return { status: 400, success: false, data: null, message: 'USER_MODULE.PROVIDE_NEW_PASSWORD' };
    if (!userId) return { status: 400, success: false, data: null, message: 'USER_MODULE.PROVIDE_USER_ID' };
    let _user = await User.findById(userId)
    if (_user) {
        Object.assign(_user, { password: newPassword })
        await _user.save();
        return { status: 200, success: true, data: _user, message: 'USER_MODULE.PASSWORD_UPDATED' };
    }
    else
        return { status: 400, success: false, data: null, message: 'USER_MODULE.NO_USER_FOUND_AGAINST_PROVIDED_USER_ID' };

}

const updateOneUser = async (filter, data) => {
    return await User.findOneAndUpdate(filter, data, { new: true })
}
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const creatRequestedSeller = async (userBody) => {
    const rolesToCheck = [roleTypes.ADMIN, roleTypes.REQUESTED_SUPPLIER, roleTypes.SUPPLIER];
    if (await User.isEmailTakenWithRole(userBody.email, { $in: rolesToCheck })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.EMAIL_ALREADY_TAKEN');
    }
    if (await User.isPhoneTakenWithRole(userBody.phone, { $in: rolesToCheck })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'USER_MODULE.PHONE_ALREADY_TAKEN');
    }
    userBody.role = "requestedSeller";
    const user = await User.create(userBody);
    return user;
};
const validateRefCode = async (refCode) => {
    const sellerDetailService = require("../sellerDetail/sellerDetail.service");
    let refEnumValid = false;
    refEnumValid = config.customRefCodes.includes(refCode);
    await sellerDetailService.getByRRP(refCode);
    let user = await User.findOne({ refCode: refCode });
    if (!user) user = await sellerDetailService.getByRRP(refCode);

    return user || refEnumValid;
}



const getAllUser = async (filter, options, search,schoolId) => {
    filter = setAtasDateCondition(filter)
    options = sortByParser(options, { 'createdAt': -1 });
    // filter.schoolId=mongoose.Types.ObjectId(schoolId)
        filter.schoolId=schoolId
    let result = await usersearchQuery(filter, options, search);
    if (!result || !Object.keys(result).length) {
      result = {
        "page": options.page || 1,
        "totalPages": 0,
        "limit": options.limit || 10,
        "totalResult": 0,
        "results": []
      }
    }
    return result;
  }
  const getCustomerId=async(id)=>{
    let result=await User.findById(id).select("payment.customer")
    return result
  }


  const parseUser =  (user) => {
    const sellerDetail = { id: user?.id,fullname:user?.fullname , sellerDetail: {} }
    user = JSON.parse(JSON.stringify(user));
    if (user && user.sellerDetail) {
      const seller = user.sellerDetail;
      sellerDetail.sellerDetail = { id: seller.id, slug: seller.slug, brandName: seller.brandName, logo: seller.logo, images: seller.images };
    }
    return sellerDetail;
  }


module.exports = {
    createUser,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById,
    queryUsers,
    getUserPhone,
    querySellers,
    queryRequestedSellers,
    getSellerProfile,
    getUserProfile,
    getSellerHome,
    defaultAddress,
    getUserByPhoneNumber,
    createUserWithPhone,
    createUserWithGoogle,
    createUserWithFacebook,
    getUserByGoogleId,
    getUserByfacebookId,
    acceptRequestedSeller,
    createRequestedSeller,
    isSeller,
    changePassword,
    getByRefCode,
    updateRefCode,
    adminDefaultAddress,
    addOnWallet,
    updateBulkRefCode,
    updateWalletPin,
    createWalletPin,
    getUserByEmailAndRole,
    findOneUser,
    getAllUsers,
    changePasswordAdmin,
    updateOneUser,
    creatRequestedSeller,
    validateRefCode,
    updateStatus,
    updateProfile,
    getAllUser,
    getCustomerId,
    checkDuplication,
    // getCustomerId
    parseUser
};
