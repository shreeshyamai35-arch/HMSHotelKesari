"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.AppError = void 0;
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(statusCode, message, details) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.details = details;
        Object.setPrototypeOf(_this, AppError.prototype);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
var badRequest = function (msg, details) { return new AppError(400, msg, details); };
exports.badRequest = badRequest;
var unauthorized = function (msg) {
    if (msg === void 0) { msg = 'Unauthorized'; }
    return new AppError(401, msg);
};
exports.unauthorized = unauthorized;
var forbidden = function (msg) {
    if (msg === void 0) { msg = 'Forbidden'; }
    return new AppError(403, msg);
};
exports.forbidden = forbidden;
var notFound = function (msg) {
    if (msg === void 0) { msg = 'Not found'; }
    return new AppError(404, msg);
};
exports.notFound = notFound;
var conflict = function (msg) { return new AppError(409, msg); };
exports.conflict = conflict;
