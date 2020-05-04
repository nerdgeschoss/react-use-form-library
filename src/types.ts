import { FormField } from './FormField';
/* This type is used to take a model, parse it an return a different type
for each field. In this case, for each field of T, string | number you
get back a FormField type */
export type MappedFields<T> = {
  [P in keyof T]: FormField<T[P]>;
};

export interface UseFormProps<T> {
  model: T;
  handleSubmit?: () => void | Promise<void>;
  validations?: Partial<MappedValidation<T>>;
}

export type ValidationFunction<T> = (value?: T) => string[];
export type ValidationStrings = 'required' | 'json' | 'email';
export type FieldValidation<T> =
  | ValidationStrings
  | Array<ValidationStrings | ValidationFunction<T>>;

export type MappedValidation<T> = {
  [P in keyof T]: FieldValidation<T>;
};
