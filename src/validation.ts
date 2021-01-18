export type ValidationFunction<T> = (value?: T) => string[] | void;
export type ValidationStrings =
  | 'required'
  | 'json'
  | 'email'
  | 'website'
  | 'number';

export type ValidationType<T> =
  | RegExp
  | ValidationStrings
  | ValidationFunction<T>
  // This will allow to handle validations within Fieldsets
  | Array<RegExp>
  | Array<ValidationStrings>
  | Array<ValidationFunction<T>>;

export type FieldValidation<T> = ValidationType<T> | ValidationType<T>[];

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
      const emailReg = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
      if (typeof value === 'string' && !!value && !emailReg.test(value)) {
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
    case 'website':
      const websiteReg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
      if (typeof value === 'string' && !!value && !websiteReg.test(value)) {
        return 'invalid-website-format';
      }
      break;
    case 'number':
      if (isNaN(Number(value))) {
        return 'invalid-number';
      }
    default:
      return undefined;
  }
  return undefined;
}
