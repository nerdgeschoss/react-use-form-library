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
import { useState, useRef } from 'react';
import isEmpty from 'lodash.isempty';
import { useForceUpdate } from './util';
import { FormField } from './FormField';
var Form = /** @class */ (function () {
    function Form(model, onUpdate, validations) {
        this.fields = {};
        this.model = model;
        this.onUpdate = onUpdate;
        this.validations = validations;
        for (var key in model) {
            this.addField(key);
        }
    }
    // Changes are tracked comparing the new value agains the original passed from the model
    Form.prototype.getChanges = function () {
        var changes = {};
        for (var key in this.fields) {
            var field = this.fields[key];
            if (field.value !== this.model[key]) {
                changes[key] = field.value;
            }
        }
        return changes;
    };
    Object.defineProperty(Form.prototype, "valid", {
        // A valid form needs all of its fields to be touched and have no errors
        get: function () {
            var _this = this;
            return Object.keys(this.fields).every(function (key) {
                return _this.fields[key].valid;
            });
        },
        enumerable: true,
        configurable: true
    });
    Form.prototype.addField = function (key) {
        var _a, _b;
        this.fields[key] = new FormField({
            name: key,
            value: this.model[key],
            required: (_b = (_a = this.validations) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : _b.includes('required'),
            onUpdate: this.onUpdate,
        });
    };
    Form.prototype.touchFields = function () {
        for (var key in this.fields) {
            this.fields[key].touched = true;
        }
    };
    Form.prototype.resetForm = function () {
        for (var key in this.fields) {
            this.fields[key].value = undefined;
        }
    };
    Form.prototype.updateFields = function (model) {
        for (var key in model) {
            // Necessary to update fields that don't exist yet, due to conditional rendering
            if (!this.fields[key]) {
                this.addField(key);
            }
            this.fields[key].onChange(model[key]);
        }
        this.onUpdate();
    };
    Form.prototype.getFields = function () {
        var _this = this;
        var handler = {
            get: function (target, key) {
                var _a, _b;
                if (!target[key]) {
                    _this.addField(key);
                }
                return __assign(__assign({}, _this.fields[key]), { onChange: (_a = _this.fields[key].onChange) === null || _a === void 0 ? void 0 : _a.bind(_this.fields[key]), onBlur: (_b = _this.fields[key].onBlur) === null || _b === void 0 ? void 0 : _b.bind(_this.fields[key]), valid: _this.fields[key].valid });
            },
        };
        return new Proxy(this.fields, handler);
    };
    Form.prototype.validateFields = function (messages) {
        var _a;
        for (var key in this.validations) {
            var field = this.fields[key];
            if (field) {
                field.validate({
                    model: __assign(__assign({}, this.model), this.getChanges()),
                    validation: (_a = this.validations) === null || _a === void 0 ? void 0 : _a[key],
                    messages: messages,
                });
            }
        }
    };
    return Form;
}());
// The actual hook
export function useForm(_a) {
    var model = _a.model, handleSubmit = _a.handleSubmit, validations = _a.validations, validationMessages = _a.validationMessages;
    var forceUpdate = useForceUpdate();
    var formRef = useRef(null);
    if (!formRef.current) {
        formRef.current = new Form(model, forceUpdate, validations);
    }
    var form = formRef.current;
    // Loading state
    var _b = useState(false), submitting = _b[0], setSubmitting = _b[1];
    // Error tracking
    var _c = useState(undefined), submitError = _c[0], setSubmitError = _c[1];
    function onSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (e) {
                            e.preventDefault();
                        }
                        setSubmitting(true);
                        form.touchFields();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        if (!handleSubmit) return [3 /*break*/, 3];
                        return [4 /*yield*/, handleSubmit()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        setSubmitError(error_1);
                        return [3 /*break*/, 5];
                    case 5:
                        setSubmitting(false);
                        return [2 /*return*/];
                }
            });
        });
    }
    var changes = form.getChanges();
    form.validateFields(validationMessages);
    return {
        model: __assign(__assign({}, model), changes),
        fields: form.getFields(),
        changes: changes,
        dirty: !isEmpty(changes),
        valid: form.valid,
        submitError: submitError,
        submitting: submitting,
        onSubmit: onSubmit,
        resetForm: form.resetForm.bind(form),
        updateFields: form.updateFields.bind(form),
    };
}
//# sourceMappingURL=Form.js.map