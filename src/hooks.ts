import { useForceUpdate } from './util';
import { useRef } from 'react';
import { Form, MappedFields } from './Form';
import { MappedValidation } from './validation';

export interface UseFormProps<T> {
  model: T;
  handleSubmit?: () => void | Promise<void>;
  validations?: Partial<MappedValidation<T>>;
}

// This interface is what you get back from the useForm hook
export interface FormModel<T> {
  model: T;
  fields: MappedFields<T>;
  changes: Partial<T>;
  dirty: boolean;
  valid: boolean;
  submitting: boolean;
  validations?: Partial<MappedValidation<T>>;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  reset: () => void;
  handleSubmit?: (form: Form<T>) => void | Promise<void>;
}

// The actual hook
export function useForm<T>({
  model,
  handleSubmit,
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
    submitting: form.submitting,
    onSubmit: form.onSubmit.bind(form),
    reset: form.reset.bind(form),
  };
}
