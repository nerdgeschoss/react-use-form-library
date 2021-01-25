import { FormField } from './FormField';
import { compact } from './util';
import { FieldValidation } from './validation';

interface AddItem<T extends Array<T[number]>> {
  value: T[number];
  validation?: FieldValidation<T[number]>;
}
export class FieldSet<T extends Array<T[number]>> extends Array<
  FormField<T[number]>
> {
  private onUpdate: () => void;

  constructor({
    value,
    onUpdate,
    validation,
  }: {
    value?: T;
    validation?: Array<FieldValidation<T[number]>>;
    onUpdate: () => void;
  }) {
    super();
    this.onUpdate = onUpdate;
    if (value && value.length) {
      this.addFields(
        ...value.map((item, index) => {
          return {
            value: item,
            validation: validation?.[index],
          };
        })
      );
    }
  }

  public onChange = (value?: T): void => {
    value?.forEach((val, index) => {
      if (this[index] === undefined) {
        this.addFields(val);
      } else {
        this[index].onChange(val);
      }
    });
  };

  public setTouched(value: boolean): void {
    this.forEach((field) => field.setTouched(value));
  }

  public reset(): void {
    this.forEach((field) => field.reset());
  }

  public validate<M>(model: M): void {
    this.forEach((field) => field.validate(model));
  }

  public addFields(...items: Array<AddItem<T> | T[number]>): void {
    items.forEach((item) => {
      this.push(
        new FormField({
          value: typeof item === 'object' ? (item as AddItem<T>).value : item,
          onUpdate: this.onUpdate,
          validation:
            typeof item === 'object'
              ? (item as AddItem<T>).validation
              : undefined,
        })
      );
    });
    this.onUpdate();
  }

  public removeField(index: number): void {
    this.splice(index, 1);
    this.onUpdate();
  }

  // CLASS GETTERS
  public get value(): T {
    const values: unknown[] = [];

    this.forEach((field) => {
      values.push(field.value);
    });

    return compact(values) as T;
  }

  public get dirty(): boolean {
    return this.some((field) => field.dirty);
  }

  public get touched(): boolean {
    return this.every((field) => field.touched);
  }

  public get valid(): boolean {
    return this.every((field) => field.valid);
  }
}
