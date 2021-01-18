import { FormField } from './FormField';
import { FieldValidation } from './validation';
import compact from 'lodash.compact';

// Extract the type of a given array
export type ArrayElement<
  ArrayType extends readonly unknown[]
> = ArrayType[number];

export class FieldSet<T extends Array<ArrayElement<T>>> extends Array<
  FormField<ArrayElement<T>>
> {
  constructor({
    value,
    onUpdate,
    validation,
  }: {
    value?: T;
    validation?: Array<FieldValidation<ArrayElement<T>>>;
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
