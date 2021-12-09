import { copy, isEqual, uniq } from './util';
import { MappedValidation, validateValue } from './validation';

/* This type is used to take a model, parse it an return a different type
for each field. In this case, for each field of T, string | number you
get back a FormField type */
export type MappedFields<T> = {
  [P in keyof Required<T>]: T[P] extends unknown[]
    ? FieldSet<T[P][0]>
    : T[P] extends Record<string, unknown> | undefined | null
    ? NestedField<NonNullable<T[P]>>
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

interface NestedField<T> extends Field<T> {
  get fields(): MappedFields<T>;
}

interface FieldSetField<T> extends Field<T> {
  remove: () => void;
}

interface FieldSet<T> extends Field<T[]> {
  get elements(): Array<NestedFieldSetField<T>>;
  add: (element: T) => void;
}

type NestedFieldSetField<T> = NestedField<T> & FieldSetField<T>;

export class FieldImplementation<T, Model>
  implements NestedField<T>, FieldSetField<T>
{
  value: T;
  required = false;
  focused = false;
  touched = false;
  errors: string[] = [];
  elements: FieldImplementation<T, Model>[] = [];

  #fields: Partial<MappedFields<T>> = {};
  #originalValue: T;
  #validations: MappedValidation<T>;
  #model: Model;
  #onUpdate: () => void;
  #onRemove?: () => void;

  declare valid: boolean;

  constructor({
    value,
    validations,
    onUpdate,
    onRemove,
    model,
  }: {
    value: T;
    onUpdate: () => void;
    validations: MappedValidation<T>;
    onRemove?: () => void;
    model: Model;
  }) {
    this.value = copy(value);
    this.#originalValue = value;
    this.#validations = validations;
    this.#model = model;
    if (
      (Array.isArray(validations) &&
        validations.some((e) => e === 'required')) ||
      validations === 'required'
    ) {
      this.required = true;
    }
    this.createSubfields();
    this.#onUpdate = onUpdate;
    this.#onRemove = onRemove;

    Object.defineProperty(this, 'valid', {
      enumerable: true,
      get: () => {
        return this.errors.length === 0 && this.subfields.every((e) => e.valid);
      },
    });
  }

  get fields(): MappedFields<T> {
    if (!this.value) {
      this.value = {} as T;
      this.#onUpdate();
    }
    const handler = {
      get: (target: MappedFields<T>, key: string) => {
        if (!target[key]) {
          const field = new FieldImplementation({
            value: this.value[key],
            onUpdate: () => {
              this.value[key] = field.value;
              this.#onUpdate();
            },
            validations: this.#validations[key] || {},
            model: this.#model,
          });
          target[key] = field;
        }
        return target[key];
      },
    };
    return new Proxy(this.#fields as MappedFields<T>, handler);
  }

  add(element: T): void {
    this.value = [
      ...(this.value as unknown as unknown[]),
      element,
    ] as unknown as T;
    this.elements.push(this.createFieldSetField(element));
    this.#onUpdate();
  }

  remove(): void {
    this.#onRemove?.();
  }

  reset(): void {
    this.value = this.#originalValue;
    this.touched = false;
    this.subfields.forEach((e) => e.reset());
    this.#onUpdate();
  }

  touch(): void {
    this.touched = true;
    this.subfields.forEach((e) => e.touch());
    this.#onUpdate();
  }

  onChange = (value: T): void => {
    this.value = value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        this.elements = [];
        this.createSubfields();
      } else {
        uniq([...Object.keys(this.#fields), ...Object.keys(value)]).forEach(
          (key) => {
            this.fields[key].onChange(value[key]);
          }
        );
      }
    }
    this.#onUpdate();
  };

  onFocus: () => void = () => {
    this.focused = true;
    this.#onUpdate();
  };

  onBlur: () => void = () => {
    this.focused = false;
    this.touched = true;
    this.#onUpdate();
  };

  validate(): void {
    const validations = this.#validations;
    if (this.isNestedValidation) {
      Object.keys(validations).forEach((key) => {
        this.fields[key].validate();
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.errors = validateValue(this.value, this.#model, validations as any);
    }
    this.elements.forEach((e) => e.validate());
  }

  get dirty(): boolean {
    return !isEqual(this.value, this.#originalValue);
  }

  private get subfields(): Array<FieldImplementation<unknown, Model>> {
    return this.elements.concat(Object.values(this.#fields)) as Array<
      FieldImplementation<unknown, Model>
    >;
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
    const value = this.value;
    if (Array.isArray(value)) {
      this.elements = value.map((e) => this.createFieldSetField(e));
    } else {
      // make sure as many fields as possible are initialized
      if (this.isNestedValidation) {
        Object.keys(this.#validations).forEach((e) => this.fields[e]);
      }
      if (value && typeof value === 'object') {
        Object.keys(value).forEach((e) => this.fields[e]);
      }
    }
  }

  private createFieldSetField(value: T): FieldImplementation<T, Model> {
    const field = new FieldImplementation({
      value,
      onUpdate: () => {
        const index = this.elements.indexOf(field);
        this.value[index] = field.value;
        this.#onUpdate();
      },
      validations: this.#validations,
      onRemove: () => {
        const index = this.elements.indexOf(field);
        (this.value as unknown as unknown[]).splice(index, 1);
        this.elements.splice(index, 1);
        this.#onUpdate();
      },
      model: this.#model,
    });
    return field;
  }
}
