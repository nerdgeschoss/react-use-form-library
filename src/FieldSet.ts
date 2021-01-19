import { FormField } from './FormField';
import { FieldValidation } from './validation';
import compact from 'lodash.compact';

interface AddItem<T extends Array<T[number]>> {
  value: T[number];
  validation?: FieldValidation<T[number]>;
}
export class FieldSet<T extends Array<T[number]>> extends Array<
  FormField<T[number]>
> {
  private onUpdate: () => void;
  public validation?: Array<FieldValidation<T[number]>>;

  constructor({
    value,
    onUpdate,
    validation,
  }: {
    value?: T;
    validation?: Array<FieldValidation<T[number]>>;
    onUpdate: () => void;
  }) {
    super(
      ...(value
        ? [
            ...value.map((item, index) => {
              return new FormField({
                value: item,
                onUpdate,
                validation: validation?.[index],
              });
            }),
          ]
        : [])
    );
    this.onUpdate = onUpdate;
    this.validation = validation;
  }

  public onChange = (value?: T): void => {
    value?.forEach((val, index) => {
      this[index].onChange(val);
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

  public add(...items: Array<AddItem<T> | T[number]>): void {
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
  }

  public remove(index: number): void {
    this.splice(index, 1);
  }

  // CLASS GETTERS
  public get value(): T {
    return compact(
      this.map((field) => {
        if (field instanceof FormField) {
          return field.value;
        }
      })
    ) as T;
  }

  public get dirty(): boolean {
    return this.some((field) => field.dirty);
  }

  public get touched(): boolean {
    return this.every((field) => field.touched);
  }
}
