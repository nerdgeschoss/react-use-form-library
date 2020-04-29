import {
  FieldValidation,
  validateValue,
  CustomValidationMessages,
} from './validation';

export class FormField<T> {
  public name: string;
  public value?: T;
  private originalValue?: T;
  public touched = false;
  public required = false;
  public errors: string[] = [];
  private onUpdate: () => void;
  public onFocus?: () => void;

  constructor({
    name,
    value,
    required,
    onUpdate,
  }: {
    name: string;
    value: T;
    required: boolean;
    onUpdate: () => void;
  }) {
    this.name = name;
    this.originalValue = value;
    this.value = value;
    this.required = required;
    this.onUpdate = onUpdate;

    if (this.value && !this.touched) {
      this.touched = true;
    }
  }

  public onChange(value?: T): void {
    this.value = value;
    this.touched = true;
    this.onUpdate();
  }

  public onBlur(): void {
    if (!this.touched) {
      this.touched = true;
      this.onUpdate();
    }
  }

  public hasValue(): boolean {
    if (typeof this.value === 'string' || Array.isArray(this.value)) {
      return !!this.value.length;
    }
    if (typeof this.value === 'number') {
      return this.value !== undefined && this.value !== null;
    }

    return !!this.value;
  }

  /* We need to pass validation here as an argument because of the types. If we want to store validation as a property of the class,
   then we would need to pass a second type argument to the class itself so FormField<T, M> where T is the actual value type and M
   is the form model */
  /* It would be the same case if we wanted to have a validation property defined as validation: (model: Partial<M>) => void (since the errors
    saved as this.errors = errors) */
  public validate<M>({
    model,
    validation,
    messages,
  }: {
    model: M;
    validation?: FieldValidation<M>;
    messages?: CustomValidationMessages;
  }): void {
    let errors: string[] = [];
    if (validation && this.touched) {
      validation.forEach((validate) => {
        if (typeof validate === 'string') {
          const error = validateValue({
            value: this.hasValue() ? this.value : undefined,
            type: validate,
            messages,
          });
          if (error) {
            errors.push(error);
          }
        }
        if (typeof validate === 'function') {
          const validateErrors = validate(model) || [];
          errors = [...errors, ...validateErrors];
        }
      });
    }
    this.errors = errors;
  }

  public get valid(): boolean {
    // First condition is the default behavior for fields that are not required. If there are no errors then the field is valid
    if (!this.required && !this.errors.length) {
      return true;
    } else {
      // If the field is required tho, and it hasn't been touched, then it is not valid even if there are no errors (yet);
      if (!this.touched) {
        return false;
      } else {
        // If the field is required and it has been touched, then we can check for errors.
        const errors = !!this.errors.length;
        return !errors;
      }
    }
  }

  public get dirty(): boolean {
    return this.originalValue !== this.value;
  }
}
