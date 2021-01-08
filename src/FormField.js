"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.FormField = void 0;
var validation_1 = require("./validation");
var FormField = /** @class */ (function () {
    function FormField(_a) {
        var _this = this;
        var value = _a.value, validation = _a.validation, onUpdate = _a.onUpdate;
        var _b;
        this.touched = false;
        this.required = false;
        this.errors = [];
        // CLASS METHODS
        this.onChange = function (value) {
            _this.value = value;
            _this.touched = true;
            _this.onUpdate();
        };
        this.onBlur = function () {
            if (!_this.touched) {
                _this.touched = true;
                _this.onUpdate();
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onFocus = function () { };
        // This method is helpful to correctly display an empty state in the view.
        this.hasValue = function () {
            if (typeof _this.value === 'string' || Array.isArray(_this.value)) {
                return !!_this.value.length;
            }
            if (typeof _this.value === 'number') {
                return _this.value !== undefined && _this.value !== null;
            }
            return !!_this.value;
        };
        // Validate takes the updated model as a parameter to allow cross-field validation
        this.validate = function (model) {
            var errors = [];
            // Validation can be a single string "required", an array ["required", "email"] or a custom function
            // If it is a single string, parsing into an array is necessary
            var validation = _this.validation
                ? Array.isArray(_this.validation)
                    ? _this.validation
                    : [_this.validation]
                : undefined;
            if (validation) {
                validation.forEach(function (validate) {
                    if (typeof validate === 'string') {
                        var error = validation_1.validateValue({
                            value: _this.value,
                            type: validate
                        });
                        if (error) {
                            errors.push(error);
                        }
                    }
                    if (typeof validate === 'function') {
                        var validateErrors = validate(model) || [];
                        errors = __spreadArrays(errors, validateErrors);
                    }
                });
            }
            _this.errors = errors;
        };
        this.reset = function () {
            _this.value = _this.originalValue;
        };
        this.originalValue = value;
        this.value = value;
        this.validation = validation;
        this.required = ((_b = this.validation) === null || _b === void 0 ? void 0 : _b.includes('required')) ? true : false;
        this.onUpdate = onUpdate;
    }
    Object.defineProperty(FormField.prototype, "valid", {
        // CLASS GETTERS
        get: function () {
            return !this.errors.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FormField.prototype, "dirty", {
        get: function () {
            return this.originalValue !== this.value;
        },
        enumerable: false,
        configurable: true
    });
    return FormField;
}());
exports.FormField = FormField;
