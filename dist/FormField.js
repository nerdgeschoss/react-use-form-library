var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { validateValue, } from './validation';
var FormField = /** @class */ (function () {
    function FormField(_a) {
        var name = _a.name, value = _a.value, required = _a.required, onUpdate = _a.onUpdate;
        this.touched = false;
        this.required = false;
        this.dirty = false;
        this.errors = [];
        this.name = name;
        this.value = value;
        this.required = required;
        this.onUpdate = onUpdate;
        if (this.value && this.required && !this.touched) {
            this.touched = true;
        }
        // Since validation only happens on update, this is necessary to trigger validation for fields that are created conditionally
        this.onUpdate();
    }
    FormField.prototype.onChange = function (value) {
        this.value = value;
        this.touched = true;
        this.onUpdate();
    };
    FormField.prototype.onBlur = function () {
        if (!this.touched) {
            this.touched = true;
            this.onUpdate();
        }
    };
    FormField.prototype.hasValue = function () {
        if (typeof this.value === 'string' || Array.isArray(this.value)) {
            return !!this.value.length;
        }
        if (typeof this.value === 'number') {
            return this.value !== undefined && this.value !== null;
        }
        return !!this.value;
    };
    /* We need to pass validation here as an argument because of the types. If we want to store validation as a property of the class,
     then we would need to pass a second type argument to the class itself so FormField<T, M> where T is the actual value type and M
     is the form model */
    /* It would be the same case if we wanted to have a validation property defined as validation: (model: Partial<M>) => void (since the errors
      saved as this.errors = errors) */
    FormField.prototype.validate = function (_a) {
        var _this = this;
        var model = _a.model, validation = _a.validation, messages = _a.messages;
        var errors = [];
        if (validation && this.touched) {
            validation.forEach(function (validate) {
                if (typeof validate === 'string') {
                    var error = validateValue({
                        value: _this.hasValue() ? _this.value : undefined,
                        type: validate,
                        messages: messages,
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
        this.errors = errors;
    };
    Object.defineProperty(FormField.prototype, "valid", {
        get: function () {
            // First condition is the default behavior for fields that are not required. If there are no errors then the field is valid
            if (!this.required && !this.errors.length) {
                return true;
            }
            else {
                // If the field is required tho, and it hasn't been touched, then it is not valid even if there are no errors (yet);
                if (!this.touched) {
                    return false;
                }
                else {
                    // If the field is required and it has been touched, then we can check for errors.
                    var errors = !!this.errors.length;
                    return !errors;
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    return FormField;
}());
export { FormField };
//# sourceMappingURL=FormField.js.map