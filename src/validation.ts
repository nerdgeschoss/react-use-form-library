export type ValidationFunction<T> = (value?: T) => string[];
export type ValidationStrings = 'required' | 'json' | 'email';
export type FieldValidation<T> =
  | ValidationStrings
  | Array<ValidationStrings | ValidationFunction<T>>;

export type MappedValidation<T> = {
  [P in keyof T]: FieldValidation<T>;
};

export function validateValue<T>({
  value,
  type,
}: {
  value?: T;
  type: ValidationStrings;
}): string | undefined {
  switch (type) {
    case 'required':
      if (!value) {
        return 'required-field';
      }
      break;
    case 'email':
      const reg = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
      if (typeof value === 'string' && !!value && !reg.test(value)) {
        return 'invalid-email-address';
      }
      break;
    case 'json':
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          return 'invalid-json';
        }
      }
      break;
    default:
      return undefined;
  }
  return undefined;
}