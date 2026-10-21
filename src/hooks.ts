import { Form, SubmissionStatus } from './form';
import { isEqual, useForceUpdate } from './util';

import { MappedFields } from './field';
import { MappedValidation } from './validation';
import { useRef, useState } from 'react';
import { FormViews } from './views';

export interface UseFormProps<T> {
  model: T;
  validations?: Partial<MappedValidation<T>>;
  _unstableUpdateModelOnChange?: boolean;
  onSubmit?: (form: Form<T>) => void | Promise<void>;
  onSubmitError?: (error: Error) => void;
  onInit?: (form: Form<T>) => void;
  onChange?: (form: Form<T>) => void;
}

// This interface is what you get back from the useForm hook
export interface FormModel<T> {
  model: T;
  fields: MappedFields<T>;
  changes: Partial<T>;
  touchedValues: Partial<T>;
  dirty: boolean;
  valid: boolean;
  submissionStatus: SubmissionStatus;
  validations?: Partial<MappedValidation<T>>;
  error?: Error;
  updateFields: (model: Partial<T>) => void;
  onSubmit: Form<T>['submit'];
  reset: () => void;
  resetError: () => void;
}

// The actual hook
export function useForm<T>({
  model,
  onSubmit,
  onSubmitError,
  validations,
  onInit,
  onChange,
  _unstableUpdateModelOnChange,
}: UseFormProps<T>): FormModel<T> {
  // Using a custom hook to call a rerender on every change
  const onUpdate = useForceUpdate();

  const [views] = useState(() => new FormViews<T>());

  const formRef = useRef<Form<T>>(
    new Form({
      model,
      validations,
      onUpdate,
      onSubmit,
      onSubmitError,
      onInit,
      onChange,
    })
  );
  const form = formRef.current;

  if (_unstableUpdateModelOnChange && !isEqual(form.model, model)) {
    form.updateOriginalModel(model);
  }

  form.onSubmit = onSubmit;
  form.onSubmitError = onSubmitError;

  // Views give fields and model a new identity whenever their content changes.
  const { model: modelView, fields, changes, touchedValues } = views.read(form);

  return {
    model: modelView,
    fields,
    changes,
    touchedValues,
    dirty: form.dirty,
    valid: form.valid,
    error: form.error,
    submissionStatus: form.submissionStatus,
    ...views.methods(form),
  };
}
