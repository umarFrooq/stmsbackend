// const roles = ['user', 'admin', 'supplier', 'requestedSeller', 'marketplace', 'student', 'teacher', 'staff', 'admin_education'];

// Using 'superadmin' for consistency with the request, and adding 'rootUser'.
const roles = ['student', 'teacher', 'admin', 'superadmin', 'rootUser'];

const roleRights = new Map();
roleRights.set(roles[0], [ // student
  "manageProfile", 'manageReview', 'manageCart', "viewPhone", "getGroupBuy",
  'manageWishList', 'manageAddress', "managePayment", "manageVideo", "follow", "shippmentStatus",
  "changePassword", "firebaseToken",  "manageWallet", "refund", "voucher", "pushNotification","cardPayment",
  "manageQuestion","validCode","manageStatus","manageOrderStatus", "CardInfo", "transaction","oderDetial",
  "subject", "viewAttendances","viewAssignmentsGrade",
  // Assignment related for student
  "viewAssignmentsGrade", "submitAssignment", "viewOwnSubmissions"
]);

roleRights.set(roles[1], [ // teacher
  'getUsers', 'manageUsers', "manageVisitStats","manageRoles","manageQa",
  'manageCategories', 'manageProducts', "viewPhone", "manageProfile", "manageMarket",
  "manageOrderDetails", "manageOrders", "manageAllOrders", "getOrders", "manageHomePage", "manageSellerConfidentialDetails",
  "manageSellerDetail", "manageOrderStatuses", "manageStats", "changePassword", "manageShippment", "createShippment", "manageVideo", "shippmentStatus", "manageBannerSet",
  "firebaseToken", 'manageReview', "manageOrderStatus", "manageData", "manageCart", 'userManageAddress', "manageAdminCart", "manageOrderDetail", "manageRefCode", "rrpManage",
  "manageFirebase", "manageWallet", "refund", "manageRefund", "manageVoucher", "manageGroupBuy", "manageLogs", "print", "manageSiteMap", "adminOrder", "manageAllProducts",
  "pushNotification","manageDeals",  "pushNotification", "getOrderTransaction", "updateSlug", "manageCollections","manageBulkOp","manageSeller","manageDashboard","manageGA","manageTranslation",
  "manageStore","manageReport","productImport","manageSetting","socialToken","managePromotion","manageVector","manageCurrency","manageToken","manageFeedSync","manageVideoUpload", "videoCount","manageRevenue","manageStatus",  "apiKey",
  "manageTransaction","attendanceManagement", "viewAttendances", "testManagement","testResultManagement","subject", "viewGrades","manageAttendances",
  "viewOwnClassSchedule", // Teacher can view their own schedule
  // Assignment related for teacher
  "manageOwnAssignments", "viewAssignmentSubmissions", "gradeSubmission"
]);

roleRights.set(roles[2], [ // admin (School Admin)
  "reportgeneration", "manageProfile", 'manageProducts', 'manageAddress', "createShippment", "viewPhone", "manageStats",
  "manageOrders", "getOrders", "manageSellerDetail", "subjectManagement", "manageVideo", "manageSellerConfidentialDetail", "print", "notification",
  "firebaseToken", "changePassword", "csvUpload", "manageRefund", "refund", "userManageAddress",  "pushNotification","manageAnswer", "manageSeller", "manageDashboard", "manageTranslation", "manageStatus",
  "manageAnswer","manageCurrency","manageToken","manageFeedSync","videoCount","apiKey","manageShopify","premium","sellerSetting","getUsers",
  "gradeManagement", "viewGrades", "attendanceManagement", "viewAttendances", "testManagement","testResultManagement","manageUser","manageUsers","subject", "viewBranches",
  "manageClassSchedules", "viewClassSchedules", // School admin can manage and view all schedules in their school
  // Assignment related for admin
  "manageAllAssignmentsSchool", "viewAllSubmissionsSchool", "gradeSubmission"
]);

roleRights.set(roles[3], [ // superadmin (Platform Admin - can manage multiple schools if system designed for it, or top-level school admin)
  // Profile & Basic School Details
  "manageProfile",
  "manageOwnSchoolDetails", // General config for their own school (if superadmin is tied to one school) or manages all schools
  // User Management within their school(s)
  "manageSchoolUsers", // Covers creating/updating/deleting teachers, students, staff within their school(s)
  "viewSchoolUsers",   // Covers listing users within their school(s)
  // Branch Management (within their school(s))
  "manageBranches",
  "viewBranches",
  // Academic Configuration
  "manageGrades", "viewGrades",
  "manageSubjects", "viewSubjects",
  // "manageTimetables", "viewTimetables", // Replaced by ClassSchedules
  "manageClassSchedules", "viewClassSchedules", // Superadmin can manage schedules
  // Academic Operations
  "manageAttendances", "viewAttendances",
  "manageTests", "viewTests",
  "manageTestResults", "viewTestResults",
  "managePapers", "viewPapers", // For exam papers etc.
  // Financial Management
  "manageFees", "viewFees",
  "manageFines", "viewFines",
  "manageSchoolBilling",
  // Other specific permissions previously assigned
  'manageAddress', // If superadmin manages addresses related to school/users
  "manageSellerDetail", "viewPhone", // These seem less relevant for SMS superadmin, might be from copy-paste
  "manageVideo", "manageSellerConfidentialDetail", // ^ same
  "changePassword",  "notification", "firebaseToken","manageSeller", // ^ same
  "manageTranslation", // ^ same
  "gradeManagement", // Covered by manageGrades
  "attendanceManagement", // Covered by manageAttendances
  "testManagement", // Covered by manageTests
  "testResultManagement" ,// Covered by manageTestResults
  "getUsers","subject","manageUser",
  // "manageUser", "getUsers", "manageUsers", // Replaced by manageSchoolUsers, viewSchoolUsers for clarity
  // Assignment related for superadmin (assuming school-level management)
  "manageAllAssignmentsSchool", "viewAllSubmissionsSchool", "gradeSubmission"
]);

roleRights.set(roles[4], [ // rootUser
  "manageSchools", // Full CRUD on school entities
  "manageAllUsers", // Typically a root user can manage any user
  "viewSystemAnalytics", // Example permission
  "manageSystemSettings","subject", // Example permission
  // Assignment related for rootUser
  "manageAllAssignmentsRoot", "viewAllSubmissionsRoot"
]);
module.exports = {
  roles,
  roleRights,
};
