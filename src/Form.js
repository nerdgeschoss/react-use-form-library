"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.Form = void 0;
var lodash_isempty_1 = require("lodash.isempty");
var FormField_1 = require("./FormField");
var Form = /** @class */ (function () {
    function Form(_a) {
        var model = _a.model, onUpdate = _a.onUpdate, validations = _a.validations, handleSubmit = _a.handleSubmit, onSubmitError = _a.onSubmitError;
        // Cached fields created with addField().
        this.cachedFields = {};
        // Loading state for submit function
        this.submissionStatus = 'idle';
        this.originalModel = model;
        this.cachedOnUpdate = onUpdate;
        this.validations = validations;
        this.handleSubmit = handleSubmit;
        this.onSubmitError = onSubmitError;
    }
    Form.prototype.addField = function (key) {
        var _a;
        this.cachedFields[key] = new FormField_1.FormField({
            value: this.originalModel[key],
            onUpdate: this.onUpdate.bind(this),
            validation: (_a = this.validations) === null || _a === void 0 ? void 0 : _a[key]
        });
        this.cachedFields[key].validate(this.model);
    };
    // This method will touch every field, for the purpose of displaying the errors in the view
    Form.prototype.touchFields = function () {
        for (var key in this.fields) {
            this.fields[key].touched = true;
        }
    };
    // onSubmit method is a wrapper around the handleSubmit param passed to the constructor.
    // It handles the loading state and executes the handleSubmit function if it is defined.
    Form.prototype.onSubmit = function (e) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (e) {
                            e.preventDefault();
                        }
                        this.submissionStatus = 'submitting';
                        this.cachedOnUpdate();
                        // Touch fields to display errors
                        this.touchFields();
                        if (!this.handleSubmit) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.handleSubmit(this)];
                    case 2:
                        _a.sent();
                        this.submissionStatus = 'submitted';
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.submissionStatus = 'error';
                        this.error = error_1;
                        if (this.onSubmitError) {
                            this.onSubmitError(error_1);
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        this.cachedOnUpdate();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Reset function will clear the value of every field
    Form.prototype.reset = function () {
        for (var key in this.fields) {
            this.fields[key].reset();
        }
        this.submissionStatus = 'idle';
    };
    // Reset function to reset error state
    Form.prototype.resetError = function () {
        this.submissionStatus = 'idle';
        this.error = undefined;
    };
    // Mass update method.
    Form.prototype.updateFields = function (model) {
        for (var key in model) {
            this.fields[key].onChange(model[key]);
        }
        this.onUpdate();
    };
    Form.prototype.validateFields = function () {
        for (var key in this.validations) {
            var field = this.fields[key];
            if (field) {
                field.validate(this.model);
            }
        }
    };
    Form.prototype.onUpdate = function () {
        this.validateFields();
        this.cachedOnUpdate();
    };
    Object.defineProperty(Form.prototype, "changes", {
        // CLASS GETTERS
        // The changes object contains only the keys of fields which are dirty (value !== originalValue)
        get: function () {
            var changes = {};
            for (var key in this.fields) {
                var field = this.fields[key];
                if (field.dirty) {
                    changes[key] = field.value;
                }
            }
            return changes;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Form.prototype, "model", {
        // The exposed updated model contains both the original model and the changes object on top
        get: function () {
            return __assign(__assign({}, this.originalModel), this.changes);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Form.prototype, "dirty", {
        // A form is dirty only if it has any changes
        get: function () {
            return !lodash_isempty_1["default"](this.changes);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Form.prototype, "valid", {
        get: function () {
            var _this = this;
            // If there are no validations, forms are valid by default.
            if (!this.validations || Object.keys(this.validations).length === 0) {
                return true;
            }
            // A form is valid if all fields are valid
            return Object.keys(this.validations).every(function (key) {
                return _this.fields[key].valid;
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Form.prototype, "fields", {
        // Fields getter uses a proxy object to generate fields on demand. It also binds the instance methods.
        get: function () {
            var _this = this;
            var handler = {
                get: function (target, key) {
                    if (!target[key]) {
                        _this.addField(key);
                    }
                    return target[key];
                }
            };
            return new Proxy(this.cachedFields, handler);
        },
        enumerable: false,
        configurable: true
    });
    return Form;
}());
exports.Form = Form;
