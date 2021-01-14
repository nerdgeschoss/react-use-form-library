import { MappedFields } from './Form';
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
  // Nested Objects
  private cachedFields = {} as MappedFields<T>;

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
    if (this.isNestedObject) {
      return this.updateFields(value);
    }
    this.value = value;
    this.onUpdate();
  };

  public onBlur = (): void => {
    if (!this.touched) {
      this.setTouched(true);
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
    // If is a nested object run nestValidate
    if (this.isNestedObject) {
      return this.nestValidate();
    }

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

  // Helpers
  public setTouched = (value: boolean): void => {
    this.touched = value;

    for (const key in this.fields) {
      this.fields[key].setTouched(value);
    }
  };

  public reset = (): void => {
    this.setTouched(false);
    this.value = this.originalValue;
    this.nestReset();
  };

  // CLASS GETTERS
  public get valid(): boolean {
    if (this.isNestedObject) {
      return this.checkNestedValid();
    }
    return !this.errors.length;
  }

  public get dirty(): boolean {
    if (this.isNestedObject) {
      return this.checkNestedDirty();
    }
    return this.originalValue !== this.value;
  }

  public get isNestedObject(): boolean {
    return !!Object.keys(this.fields).length;
  }
  // Nested Objects
  private addField(key: string): void {
    this.cachedFields[key] = new FormField({
      value: this.originalValue?.[key],
      onUpdate: this.nestUpdate.bind(this),
      validation: this.validation?.[key],
    });
    this.cachedFields[key].validate(this.value);
  }

  public get fields(): MappedFields<T> {
    const handler = {
      get: (target: MappedFields<T>, key: string) => {
        if (!target[key]) {
          this.addField(key);
        }
        return target[key];
      },
    };

    return new Proxy(this.cachedFields, handler);
  }

  private nestUpdate(): void {
    const changes = {} as Partial<T>;

    for (const key in this.fields) {
      changes[key] = this.fields[key].value;
    }

    this.value = {
      ...this.value,
      ...changes,
    } as T;
    this.nestValidate();
    this.onUpdate();
  }

  private nestValidate(): void {
    for (const key in this.fields) {
      this.fields[key].validate(this.value);
    }
  }

  private nestReset(): void {
    for (const key in this.fields) {
      this.fields[key].reset();
    }
  }

  public updateFields(model?: Partial<T>): void {
    for (const key in model) {
      this.fields[key].onChange(model[key]);
    }
    this.onUpdate();
  }

  private checkNestedDirty(): boolean {
    return Object.keys(this.fields).some((key) => {
      return this.fields[key].dirty;
    });
  }

  private checkNestedValid(): boolean {
    return Object.keys(this.fields).every((key) => {
      return this.fields[key].valid;
    });
  }
}
