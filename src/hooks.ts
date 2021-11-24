import { useForceUpdate } from './util';
import { useRef } from 'react';
import { Form, MappedFields, SubmissionStatus } from './Form';
import { MappedValidation } from './validation';

export interface UseFormProps<T> {
  model: T;
  handleSubmit?: (form: Form<T>) => void | Promise<void>;
  onSubmitError?: (error: Error) => void;
  validations?: Partial<MappedValidation<T>>;
}

// This interface is what you get back from the useForm hook
export interface FormModel<T> {
  model: T;
  fields: MappedFields<T>;
  changes: Partial<T>;
  dirty: boolean;
  valid: boolean;
  canSubmit: boolean;
  submissionStatus: SubmissionStatus;
  validations?: Partial<MappedValidation<T>>;
  error?: Error;
  updateFields: (model: Partial<T>) => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  reset: () => void;
  resetError: () => void;
  handleSubmit?: (form: Form<T>) => void | Promise<void>;
}

// The actual hook
export function useForm<T>({
  model,
  handleSubmit,
  onSubmitError,
  validations,
}: UseFormProps<T>): FormModel<T> {
  // Using a custom hook to call a rerender on every change
  const onUpdate = useForceUpdate();
  // Saving the form in a ref, to have only 1 instance throghout the lifetime of the hook
  const formRef = useRef<Form<T> | null>(null);
  if (!formRef.current) {
    formRef.current = new Form({
      model,
      onUpdate,
      validations,
      handleSubmit,
      onSubmitError,
    });
  }

  const form = formRef.current;
  // If the submit function depends on the model, it needs to be updated on each re render to take the updated model
  form.handleSubmit = handleSubmit;

  return {
    model: form.model,
    fields: form.fields,
    changes: form.changes,
    dirty: form.dirty,
    valid: form.valid,
    canSubmit: form.canSubmit,
    error: form.error,
    submissionStatus: form.submissionStatus,
    updateFields: form.updateFields.bind(form),
    onSubmit: form.onSubmit.bind(form),
    reset: form.reset.bind(form),
    resetError: form.resetError.bind(form),
  };
}
