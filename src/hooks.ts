import { Form, SubmissionStatus } from './form';

import { MappedFields } from './field';
import { MappedValidation } from './validation';
import { useForceUpdate } from './util';
import { useRef } from 'react';

export interface UseFormProps<T> {
  model: T;
  validations?: Partial<MappedValidation<T>>;
  updateModelOnChange?: boolean;
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
  updateModelOnChange = true,
  onInit,
  onChange,
}: UseFormProps<T>): FormModel<T> {
  // Using a custom hook to call a rerender on every change
  const onUpdate = useForceUpdate();

  const formRef = useRef<Form<T>>(
    new Form({
      model,
      validations,
      onUpdate,
      onSubmit,
      onSubmitError,
      onInit,
      onChange: () => {
        onChange?.(formRef.current);
        if (updateModelOnChange) {
          formRef.current.updateOriginalModel();
        }
      },
    })
  );
  const form = formRef.current;

  form.onSubmit = onSubmit;
  form.onSubmitError = onSubmitError;

  return {
    model: form.model,
    fields: form.fields,
    changes: form.changes,
    dirty: form.dirty,
    valid: form.valid,
    error: form.error,
    submissionStatus: form.submissionStatus,
    updateFields: form.updateFields.bind(form),
    onSubmit: form.submit.bind(form),
    reset: form.reset.bind(form),
    resetError: form.resetError.bind(form),
  };
}
