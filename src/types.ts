import { FormField } from './FormField';
/* This type is used to take a model, parse it an return a different type
for each field. In this case, for each field of T, string | number you
get back a FormField type */
export type MappedFields<T> = {
  [P in keyof T]: FormField<T[P]>;
};

// This interface is what you get back from the useForm hook
export interface FormModel<T> {
  model: T;
  fields: MappedFields<T>;
  changes: Partial<T>;
  dirty: boolean;
  valid: boolean;
  submitting: boolean;
  // validate?: () => Promise<boolean>;
  submitError?: Error;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
  resetForm: () => void;
  updateFields: (model: Partial<T>) => void;
}
