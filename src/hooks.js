"use strict";
exports.__esModule = true;
exports.useForm = void 0;
var util_1 = require("./util");
var react_1 = require("react");
var Form_1 = require("./Form");
// The actual hook
function useForm(_a) {
    var model = _a.model, handleSubmit = _a.handleSubmit, onSubmitError = _a.onSubmitError, validations = _a.validations;
    // Using a custom hook to call a rerender on every change
    var onUpdate = util_1.useForceUpdate();
    // Saving the form in a ref, to have only 1 instance throghout the lifetime of the hook
    var formRef = react_1.useRef(null);
    if (!formRef.current) {
        formRef.current = new Form_1.Form({
            model: model,
            onUpdate: onUpdate,
            validations: validations,
            handleSubmit: handleSubmit,
            onSubmitError: onSubmitError
        });
    }
    var form = formRef.current;
    // If the submit function depends on the model, it needs to be updated on each re render to take the updated model
    form.handleSubmit = handleSubmit;
    return {
        model: form.model,
        fields: form.fields,
        changes: form.changes,
        dirty: form.dirty,
        valid: form.valid,
        error: form.error,
        submissionStatus: form.submissionStatus,
        onSubmit: form.onSubmit.bind(form),
        reset: form.reset.bind(form),
        resetError: form.resetError.bind(form)
    };
}
exports.useForm = useForm;
