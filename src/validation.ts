import { compact } from './util';

type ValidationFunction<T> = (value?: T) => string[] | void;
type ValidationString = 'required' | 'json' | 'email' | 'website' | 'number';

type ValidationType<T> = RegExp | ValidationString | ValidationFunction<T>;

export type FieldValidation<T> = ValidationType<T> | ValidationType<T>[];

export type MappedValidation<T> = Partial<{
  [P in keyof T]: FieldValidation<T> | MappedValidation<T[P]>;
}>;

export function validateValue<T>(
  value: T,
  validation: FieldValidation<T>
): string[] {
  // console.log('validate', value, validation);
  if (Array.isArray(value)) {
    return value.flatMap((e) => validateValue(e, validation));
  }
  if (Array.isArray(validation)) {
    return validation.flatMap((e) => validateValue(value, e));
  }
  if (typeof validation === 'string') {
    return compact([runValidationString(value, validation)]);
  }
  if (validation instanceof RegExp) {
    if (!validation.test(String(value))) {
      return ['regex-failed'];
    }
  }
  if (typeof validation === 'function') {
    return validation(value) ?? [];
  }
  return [];
}

function runValidationString<T>(
  value: T,
  type: ValidationString
): string | undefined {
  switch (type) {
    case 'required':
      if (typeof value === 'string' && !value) {
        return 'required-field';
      }
      break;
    case 'email':
      const emailReg =
        /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
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
      const websiteReg =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
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
