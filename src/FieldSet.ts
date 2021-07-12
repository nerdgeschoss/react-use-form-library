import { FormField } from './FormField';
import { compact } from './util';
import { FieldValidation } from './validation';

export class FieldSet<T extends Array<T[number]>> {
  private onUpdate: () => void;
  public required = false;
  public fields: Array<FormField<T[number]>> = [];
  private validation?: FieldValidation<T[number]>;
  // Getters Initializers
  public touched = false;
  public valid = false;
  public dirty = false;

  constructor({
    value,
    onUpdate,
    validation,
  }: {
    value?: T;
    validation?: FieldValidation<T[number]>;
    onUpdate: () => void;
  }) {
    this.onUpdate = onUpdate;
    this.validation = validation;

    if (typeof validation === 'string') {
      this.required = validation?.includes('required') ? true : false;
    }

    if (value?.length) {
      this.addFields(...value);
    }

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

  public onChange = (value?: T): void => {
    value?.forEach((val, index) => {
      if (this.fields[index] === undefined) {
        this.insert(val);
      } else {
        this.fields[index].onChange(val);
      }
    });
  };

  public setTouched(value: boolean): void {
    this.fields.forEach((field) => field.setTouched(value));
  }

  public reset(): void {
    this.fields.forEach((field) => field.reset());
  }

  public validate<M>(model: M): void {
    this.fields.forEach((field) => field.validate(model));
  }

  public addFields(...items: Array<T[number]>): void {
    items.forEach((item) => {
      this.fields.push(
        new FormField({
          value: item,
          onUpdate: this.onUpdate,
          validation: this.validation,
          removeField: this.removeField.bind(this),
        })
      );
    });
  }

  public insert(...items: Array<T[number]>): void {
    this.addFields(...items);
    this.onUpdate();
  }

  public removeField(item: FormField<T[number]>): void {
    this.fields = this.fields.filter((field) => field !== item);
    this.onUpdate();
  }

  // CLASS GETTERS
  public get value(): T {
    const values: unknown[] = [];

    this.fields.forEach((field) => {
      values.push(field.value);
    });

    return compact(values) as T;
  }

  public isDirty = (): boolean => {
    return this.fields.some((field) => field.dirty);
  };

  public isTouched = (): boolean => {
    return this.fields.every((field) => field.touched);
  };

  public isValid = (): boolean => {
    if (this.required && !this.fields.length) {
      return false;
    }
    return this.fields.every((field) => field.valid);
  };
}
