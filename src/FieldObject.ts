import { MappedValidation } from './validation';
import { MappedFields } from './Form';
import { FormField } from './FormField';
import { FieldSet } from './FieldSet';

export class FieldObject<T> {
  // Updated value
  public value?: T;
  // Original value
  private originalValue?: T;
  // Cached fields created with addField().
  private cachedFields = {} as MappedFields<T>;
  private onUpdate: () => void;
  // Validations object
  private validations?: Partial<MappedValidation<T>>;

  constructor({
    value,
    onUpdate,
    validation,
  }: {
    value?: T;
    validation?: Partial<MappedValidation<T>>;
    onUpdate: () => void;
  }) {
    this.originalValue = value;
    this.onUpdate = onUpdate;
    this.validations = validation;
  }

  private addField(key: string): void {
    const options = {
      value: this.originalValue?.[key],
      onUpdate: this.nestUpdate.bind(this),
      validation: this.validations?.[key],
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

  public setTouched = (value: boolean): void => {
    for (const key in this.fields) {
      this.fields[key].setTouched(value);
    }
  };

  public reset(): void {
    for (const key in this.fields) {
      this.fields[key].reset();
    }
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
    this.validate(this.value);
    this.onUpdate();
  }

  public validate<M>(model: M): void {
    for (const key in this.fields) {
      this.fields[key].validate(model);
    }
  }

  public onChange(model?: Partial<T>): void {
    for (const key in model) {
      this.fields[key].onChange(model[key]);
    }
    this.onUpdate();
  }

  public get dirty(): boolean {
    return Object.keys(this.fields).some((key) => {
      return this.fields[key].dirty;
    });
  }

  public get valid(): boolean {
    return Object.keys(this.fields).every((key) => {
      return this.fields[key].valid;
    });
  }
}
