import { isEqual, uniq } from './util';
import { MappedValidation, validateValue } from './validation';

/* This type is used to take a model, parse it an return a different type
for each field. In this case, for each field of T, string | number you
get back a FormField type */
export type MappedFields<T> = {
  [P in keyof Required<T>]: T[P] extends unknown[]
    ? FieldSet<T[P]>
    : T[P] extends Record<string, unknown>
    ? NestedField<T[P]>
    : Field<T[P]>;
};

export interface Field<T> {
  value: T;
  required: boolean;
  errors: string[];
  focused: boolean;
  touched: boolean;
  valid: boolean;
  dirty: boolean;

  reset: () => void;
  touch: () => void;
  onChange: (value: T) => void;
  onBlur: () => void;
  onFocus: () => void;
}

export interface NestedField<T> extends Field<T> {
  get fields(): MappedFields<T>;
}

export interface FieldSetField<T> extends Field<T> {
  remove: () => void;
}

export interface FieldSet<T> extends Field<T> {
  get elements(): Array<FieldSetField<T>>;
  add: (element: T) => void;
}

export class FieldImplementation<T> implements NestedField<T> {
  value: T;
  required = false;
  focused = false;
  touched = false;
  dirty = false;
  errors: string[] = [];

  #fields: Partial<MappedFields<T>> = {};
  #originalValue: T;
  #validations: MappedValidation<T>;
  #onUpdate: () => void;

  constructor({
    value,
    onUpdate,
    validations,
  }: {
    value: T;
    onUpdate: () => void;
    validations: MappedValidation<T>;
  }) {
    this.value = value;
    this.#originalValue = value;
    this.#validations = validations;
    if (
      (Array.isArray(validations) &&
        validations.some((e) => e === 'required')) ||
      validations === 'required'
    ) {
      this.required = true;
    }
    this.createSubfields();
    this.#onUpdate = onUpdate;
  }

  get fields(): MappedFields<T> {
    const handler = {
      get: (target: MappedFields<T>, key: string) => {
        if (!target[key]) {
          const field = new FieldImplementation({
            value: this.value[key],
            onUpdate: () => {
              this.dirty = this.subfields.some((e) => e.dirty);
              this.value[key] = field.value;
              this.#onUpdate();
            },
            validations: this.#validations[key] || {},
          });
          target[key] = field;
        }
        return target[key];
      },
    };
    return new Proxy(this.#fields as MappedFields<T>, handler);
  }

  reset(): void {
    this.value = this.#originalValue;
    this.dirty = false;
    this.touched = false;
    this.subfields.forEach((e) => e.reset());
    this.#onUpdate();
  }

  touch(): void {
    this.touched = true;
    this.subfields.forEach((e) => e.touch());
    this.#onUpdate();
  }

  onChange(value: T): void {
    this.value = value;
    this.dirty = !isEqual(value, this.#originalValue);
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
      } else {
        uniq([...Object.keys(this.#fields), ...Object.keys(value)]).forEach(
          (key) => {
            this.fields[key].onChange(value[key]);
          }
        );
      }
    }
    this.#onUpdate();
  }

  onFocus(): void {
    this.focused = true;
    this.#onUpdate();
  }

  onBlur(): void {
    this.focused = false;
    this.#onUpdate();
  }

  validate(): void {
    const validations = this.#validations;
    if (this.isNestedValidation) {
      Object.keys(validations).forEach((key) => {
        this.fields[key].validate();
      });
    } else {
      this.errors = validateValue(this.value, validations as any);
    }
  }

  get valid(): boolean {
    return this.errors.length === 0 && this.subfields.every((e) => e.valid);
  }

  private get subfields(): Array<FieldImplementation<unknown>> {
    return Object.values(this.#fields);
  }

  private get isNestedValidation(): boolean {
    const validations = this.#validations;
    return (
      typeof validations === 'object' &&
      !Array.isArray(validations) &&
      !(validations instanceof RegExp)
    );
  }

  private createSubfields(): void {
    // make sure as many fields as possible are initialized
    if (this.isNestedValidation) {
      Object.keys(this.#validations).forEach((e) => this.fields[e]);
    }
    if (
      this.value &&
      typeof this.value === 'object' &&
      !Array.isArray(this.value)
    ) {
      Object.keys(this.value).forEach((e) => this.fields[e]);
    }
  }
}
