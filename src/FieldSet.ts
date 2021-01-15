import { MappedFields } from './Form';
import {
  validateValue,
  FieldValidation,
  ValidationStrings,
} from './validation';

export class FormField<T[]> {
  public value?: T[];
  private originalValue?: T[];
  
}
