import { FieldValidation } from './types';
import { validateValue } from './validation';

export class FormField<T> {
  public name: string;
  public value?: T;
  private originalValue?: T;
  public touched = false;
  public required = false;
  public errors: string[] = [];
  private onUpdate: () => void;
  public onFocus?: () => void;
  public validation?: FieldValidation<unknown>;

  constructor({
    name,
    value,
    validation,
    onUpdate,
  }: {
    name: string;
    value: T;
    validation?: FieldValidation<unknown>;
    onUpdate: () => void;
  }) {
    this.name = name;
    this.originalValue = value;
    this.value = value;
    this.validation = validation;
    this.required = this.validation?.includes('required') ? true : false;
    this.onUpdate = onUpdate;
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

  public validate<M>(model: M): void {
    let errors: string[] = [];
    const validation = this.validation
      ? Array.isArray(this.validation)
        ? this.validation
        : [this.validation]
      : undefined;

    if (validation) {
      validation.forEach((validate) => {
        if (typeof validate === 'string') {
          const error = validateValue({
            value: this.value,
            type: validate,
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
    return !this.errors.length;
  }

  public get dirty(): boolean {
    return this.originalValue !== this.value;
  }
}
