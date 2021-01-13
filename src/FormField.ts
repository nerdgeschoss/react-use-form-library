import {
  validateValue,
  FieldValidation,
  ValidationStrings,
} from './validation';

export class FormField<T> {
  public value?: T;
  private originalValue?: T;
  public touched = false;
  public required = false;
  public errors: string[] = [];
  public validation?: FieldValidation<unknown>;
  public focused = false;
  private onUpdate: () => void;

  constructor({
    value,
    validation,
    onUpdate,
  }: {
    value: T;
    validation?: FieldValidation<unknown>;
    onUpdate: () => void;
  }) {
    this.originalValue = value;
    this.value = value;
    this.validation = validation;
    if (typeof this.validation === 'string') {
      this.required = this.validation?.includes('required') ? true : false;
    }
    this.onUpdate = onUpdate;
  }

  // CLASS METHODS
  public onChange = (value?: T): void => {
    this.value = value;
    this.onUpdate();
  };

  public onBlur = (): void => {
    if (!this.touched) {
      this.touched = true;
    }
    this.focused = false;
    this.onUpdate();
  };

  public onFocus = (): void => {
    this.focused = true;
    this.onUpdate();
  };

  // This method is helpful to correctly display an empty state in the view.
  public hasValue = (): boolean => {
    if (typeof this.value === 'string' || Array.isArray(this.value)) {
      return !!this.value.length;
    }
    if (typeof this.value === 'number') {
      return this.value !== undefined && this.value !== null;
    }

    return !!this.value;
  };

  // Validate takes the updated model as a parameter to allow cross-field validation
  public validate = <M>(model: M): void => {
    let errors: string[] = [];
    // Validation can be a single string "required", an array ["required", "email"] or a custom function
    // If it is a single string, parsing into an array is necessary
    const validation = this.validation
      ? Array.isArray(this.validation)
        ? this.validation
        : [this.validation]
      : undefined;

    if (validation) {
      validation.forEach((validate: unknown) => {
        if (typeof validate === 'string') {
          const error = validateValue({
            value: this.value,
            type: validate as ValidationStrings,
          });
          if (error) {
            errors.push(error);
          }
        }
        if (validate instanceof RegExp) {
          if (
            typeof this.value === 'string' &&
            !!this.value &&
            !validate.test(this.value)
          ) {
            errors.push('invalid-format');
          }
        }
        if (typeof validate === 'function') {
          const validateErrors = validate(model) || [];
          errors = [...errors, ...validateErrors];
        }
      });
    }
    this.errors = errors;
  };

  public reset = (): void => {
    this.value = this.originalValue;
  };

  // CLASS GETTERS
  public get valid(): boolean {
    return !this.errors.length;
  }

  public get dirty(): boolean {
    return this.originalValue !== this.value;
  }
}
