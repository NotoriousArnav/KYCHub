"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendKYCVerificationEmail = exports.sendKYCRejectedNotification = exports.sendKYCApprovedNotification = exports.sendKYCSubmittedNotification = exports.sendWelcomeEmail = exports.sendEmail = void 0;
var nodemailer_1 = require("nodemailer");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
// Email transporter configuration
var transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// Verify connection
transporter.verify().then(function () {
    console.log('SMTP server is ready to send emails');
}).catch(function (err) {
    console.error('SMTP server connection error:', err);
});
// Send email function
var sendEmail = function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var info, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Validate that either html or text is provided
                if (!options.html && !options.text) {
                    throw new Error('Either html or text must be provided in email options');
                }
                return [4 /*yield*/, transporter.sendMail({
                        from: "".concat(process.env.SMTP_FROM_NAME, " <").concat(process.env.SMTP_FROM_EMAIL, ">"),
                        to: options.to,
                        subject: options.subject,
                        html: options.html,
                        text: options.text,
                    })];
            case 1:
                info = _a.sent();
                console.log('Email sent:', info.messageId);
                return [2 /*return*/, info];
            case 2:
                error_1 = _a.sent();
                console.error('Error sending email:', error_1);
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.sendEmail = sendEmail;
// Email template functions
var sendWelcomeEmail = function (merchantEmail, merchantName) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                subject = 'Welcome to KYC Platform';
                html = "\n    <h1>Welcome ".concat(merchantName, "!</h1>\n    <p>Thank you for registering with our KYC platform. Your account has been successfully created.</p>\n    <p>You can now log in to your dashboard and start generating KYC links for your customers.</p>\n    <p>Best regards,<br>The KYC Team</p>\n  ");
                return [4 /*yield*/, (0, exports.sendEmail)({
                        to: merchantEmail,
                        subject: subject,
                        html: html,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendWelcomeEmail = sendWelcomeEmail;
var sendKYCSubmittedNotification = function (merchantEmail, merchantName, userName, userEmail) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                subject = 'New KYC Submission Received';
                html = "\n    <h1>New KYC Submission</h1>\n    <p>Hello ".concat(merchantName, ",</p>\n    <p>A new KYC submission has been received from:</p>\n    <ul>\n      <li><strong>Name:</strong> ").concat(userName, "</li>\n      <li><strong>Email:</strong> ").concat(userEmail, "</li>\n    </ul>\n    <p>Please log in to your dashboard to review and process this submission.</p>\n    <p>Best regards,<br>The KYC Team</p>\n  ");
                return [4 /*yield*/, (0, exports.sendEmail)({
                        to: merchantEmail,
                        subject: subject,
                        html: html,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendKYCSubmittedNotification = sendKYCSubmittedNotification;
var sendKYCApprovedNotification = function (userEmail, userName, merchantName) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                subject = 'Your KYC Has Been Approved';
                html = "\n    <h1>KYC Approved</h1>\n    <p>Hello ".concat(userName, ",</p>\n    <p>Your KYC submission for ").concat(merchantName, " has been approved.</p>\n    <p>Thank you for completing the verification process.</p>\n    <p>Best regards,<br>The KYC Team</p>\n  ");
                return [4 /*yield*/, (0, exports.sendEmail)({
                        to: userEmail,
                        subject: subject,
                        html: html,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendKYCApprovedNotification = sendKYCApprovedNotification;
var sendKYCRejectedNotification = function (userEmail, userName, merchantName, reason) { return __awaiter(void 0, void 0, void 0, function () {
    var subject, html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                subject = 'Your KYC Submission Requires Attention';
                html = "\n    <h1>KYC Submission Update</h1>\n    <p>Hello ".concat(userName, ",</p>\n    <p>Your KYC submission for ").concat(merchantName, " has been reviewed and requires additional information.</p>\n    <p><strong>Reason:</strong> ").concat(reason, "</p>\n    <p>Please log in to update your submission with the requested information.</p>\n    <p>Best regards,<br>The KYC Team</p>\n  ");
                return [4 /*yield*/, (0, exports.sendEmail)({
                        to: userEmail,
                        subject: subject,
                        html: html,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendKYCRejectedNotification = sendKYCRejectedNotification;
// Send KYC verification email to user
var sendKYCVerificationEmail = function (userEmail, userName, merchantName, kycData, verificationToken) { return __awaiter(void 0, void 0, void 0, function () {
    var verificationLink, html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                verificationLink = "".concat(process.env.FRONTEND_URL || 'http://localhost:5173', "/verify-kyc/").concat(verificationToken);
                html = "\n    <h1>Please Verify Your KYC Submission</h1>\n    <p>Hello ".concat(userName, ",</p>\n    <p>Thank you for submitting your KYC for ").concat(merchantName, ". To prevent spam, please verify your submission:</p>\n    \n    <div style=\"background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;\">\n      <h2>Your Submitted Information:</h2>\n      <p><strong>Name:</strong> ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.name) || 'Not provided', "</p>\n      <p><strong>Email:</strong> ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.email) || 'Not provided', "</p>\n      <p><strong>Phone:</strong> ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.phone) || 'Not provided', "</p>\n      <p><strong>Address:</strong> ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.street) || '', ", ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.city) || '', ", ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.state) || '', " ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.postalCode) || '', "</p>\n      <p><strong>ID Type:</strong> ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.idType) || 'Not provided', "</p>\n      <p><strong>ID Number:</strong> ").concat((kycData === null || kycData === void 0 ? void 0 : kycData.idNumber) || 'Not provided', "</p>\n    </div>\n    \n    <div style=\"text-align: center; margin: 30px 0;\">\n      <a href=\"").concat(verificationLink, "\" \n         style=\"background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;\">\n        Confirm Submission\n      </a>\n    </div>\n    \n    <p style=\"font-size: 0.9em; color: #666;\">\n      This verification step ensures only legitimate submissions reach the merchant dashboard.\n      Link expires in 24 hours.\n    </p>\n    <p>If you didn't submit this request, please ignore this email.</p>\n    <p>Best regards,<br>The KYC Team</p>\n  ");
                return [4 /*yield*/, (0, exports.sendEmail)({
                        to: userEmail,
                        subject: "Please verify your KYC submission for ".concat(merchantName),
                        html: html,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.sendKYCVerificationEmail = sendKYCVerificationEmail;
