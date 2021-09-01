import { FieldSet } from './FieldSet';
import { MappedFields } from './Form';
import { uniq } from './util';
import {
  validateValue,
  FieldValidation,
  ValidationStrings,
} from './validation';

export class FormField<T> {
  public value?: T;
  private originalValue?: T;
  public required = false;
  public errors: string[] = [];
  public validation?: FieldValidation<unknown>;
  public focused = false;
  private onUpdate: () => void;
  private fieldTouched = false;
  // Nested Objects
  private cachedFields = {} as MappedFields<T>;
  private removeField?: (item: FormField<T>) => void;
  // Getters Initializers
  public touched = false;
  public valid = false;
  public dirty = false;

  constructor({
    value,
    validation,
    onUpdate,
    removeField,
  }: {
    value: T;
    validation?: FieldValidation<unknown>;
    onUpdate: () => void;
    removeField?: (item: FormField<T>) => void;
  }) {
    this.originalValue = value;
    this.value = value;
    this.validation = validation;
    this.onUpdate = onUpdate;
    this.removeField = removeField;

    // Define getters in the constructor to make them enumerable;
    Object.defineProperty(this, 'touched', {
      enumerable: true,
      get: function () {
        return this.isTouched();
      },
    });
    Object.defineProperty(this, 'valid', {
      enumerable: true,
      get: function () {
        return this.isValid();
      },
    });
    Object.defineProperty(this, 'dirty', {
      enumerable: true,
      get: function () {
        return this.isDirty();
      },
    });
  }

  // CLASS METHODS
  public onChange = (value?: T, disableUpdate?: boolean): void => {
    // Object and not null needs to be checked here for instantation of new field
    if (value !== null && (typeof value === 'object' || this.isNestedObject)) {
      return this.updateFields(value);
    }
    this.value = value;
    if (!disableUpdate) {
      this.onUpdate();
    }
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
    if (this.isNestedObject) {
      return this.checkNestedValue();
    }

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

    if (errors.includes('required-field')) {
      this.required = true;
    }

    this.errors = errors;
  };

  // Helpers
  public setTouched = (value: boolean): void => {
    this.fieldTouched = value;

    for (const key of this.nestedKeys) {
      this.fields[key].setTouched(value);
    }
  };

  public reset = (): void => {
    this.setTouched(false);
    this.value = this.originalValue;

    if (this.isNestedObject) {
      this.nestReset();
    }
  };

  // CLASS GETTERS
  public isTouched = (): boolean => {
    if (this.isNestedObject) {
      return this.checkNestedTouched();
    }
    return this.fieldTouched;
  };

  public isValid = (): boolean => {
    if (this.isNestedObject) {
      return this.checkNestedValid();
    }
    return !this.errors.length;
  };

  public isDirty = (): boolean => {
    if (this.isNestedObject) {
      return this.checkNestedDirty();
    }
    return this.originalValue !== this.value;
  };

  // NESTED OBJECTS
  /* We need to check both in the original value and the generated fields because the field could be 
  initialized with an empty value and fields created on demand */
  private get nestedKeys(): string[] {
    let keys: string[] = [];
    if (this.value === null) {
      return [];
    }
    if (typeof this.value === 'object') {
      keys = [...Object.keys(this.value)];
    }
    keys = [...keys, ...Object.keys(this.fields)];

    return uniq(keys);
  }

  private get isNestedObject(): boolean {
    return !!this.nestedKeys.length;
  }

  private addField(key: string): void {
    const options = {
      value: this.originalValue?.[key],
      onUpdate: this.nestUpdate,
      validation: this.validation?.[key],
    };

    if (Array.isArray(this.originalValue?.[key])) {
      this.cachedFields[key] = new FieldSet(options);
    } else {
      this.cachedFields[key] = new FormField(options);
    }

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

  private nestUpdate = (): void => {
    const changes = {} as Partial<T>;
    for (const key of this.nestedKeys) {
      changes[key] = this.fields[key].value;
    }
    this.value = {
      ...this.value,
      ...changes,
    } as T;
    this.nestValidate();
    this.onUpdate();
  };

  private nestValidate(): void {
    for (const key of this.nestedKeys) {
      this.fields[key].validate(this.value);
    }
  }

  private nestReset(): void {
    for (const key of this.nestedKeys) {
      this.fields[key].reset();
    }
  }

  private updateFields(model?: Partial<T>): void {
    for (const key in model) {
      this.fields[key].onChange(model[key], true);
    }
    this.onUpdate();
  }

  private checkNestedDirty(): boolean {
    return this.nestedKeys.some((key) => {
      return this.fields[key].dirty;
    });
  }

  private checkNestedValid = (): boolean => {
    return this.nestedKeys.every((key) => this.fields[key].valid);
  };

  private checkNestedTouched = (): boolean => {
    return this.nestedKeys.every((key) => this.fields[key].touched);
  };

  private checkNestedValue = (): boolean => {
    return this.nestedKeys.every((key) => this.fields[key].hasValue());
  };

  // FIELDSET
  public remove(): void {
    this.removeField?.(this);
  }
}
