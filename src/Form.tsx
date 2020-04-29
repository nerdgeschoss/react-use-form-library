import React, { useRef } from 'react';
import isEmpty from 'lodash.isempty';
import { useForceUpdate } from './util';
import { FormField } from './FormField';
import { MappedValidation, CustomValidationMessages } from './validation';
import { MappedFields, FormModel } from './types';

export class Form<T> {
  private model: T;
  private cachedFields = {} as MappedFields<T>;
  private validations?: Partial<MappedValidation<T>>;
  private cachedOnUpdate: () => void;
  private handleSubmit: (() => void | Promise<void>) | undefined;
  public submitError: Error | undefined = undefined;
  public loading = false;

  constructor({
    model,
    onUpdate,
    validations,
    handleSubmit,
  }: {
    model: T;
    onUpdate: () => void;
    validations?: Partial<MappedValidation<T>>;
    handleSubmit?: () => void | Promise<void>;
  }) {
    this.model = model;
    this.cachedOnUpdate = onUpdate;
    this.validations = validations;
    this.handleSubmit = handleSubmit;

    for (const key in model) {
      this.addField(key);
    }
  }

  // Changes are tracked comparing the new value agains the original passed from the model
  public getChanges(): Partial<T> {
    const changes = {} as Partial<T>;

    for (const key in this.cachedFields) {
      const field = this.cachedFields[key];
      if (field.dirty) {
        changes[key] = field.value;
      }
    }

    return changes;
  }

  // A valid form needs all of its fields to be touched and have no errors
  public get valid(): boolean {
    return Object.keys(this.cachedFields).every((key) => {
      return this.cachedFields[key].valid;
    });
  }

  public addField(key: string): void {
    this.cachedFields[key] = new FormField({
      name: key,
      value: this.model[key],
      required: this.validations?.[key]?.includes('required'),
      onUpdate: this.onUpdate.bind(this),
    });
  }

  public touchFields(): void {
    for (const key in this.cachedFields) {
      this.cachedFields[key].touched = true;
    }
  }

  public async onSubmit(e?: React.FormEvent<HTMLFormElement>): Promise<void> {
    if (e) {
      e.preventDefault();
    }
    this.loading = true;
    this.touchFields();
    try {
      if (this.handleSubmit) {
        await this.handleSubmit();
      }
    } catch (error) {
      this.submitError = error;
    }
    this.loading = false;
  }

  public reset(): void {
    for (const key in this.cachedFields) {
      this.cachedFields[key].value = undefined;
    }
  }

  public updateFields(model: Partial<T>): void {
    for (const key in model) {
      // Necessary to update fields that don't exist yet, due to conditional rendering
      if (!this.cachedFields[key]) {
        this.addField(key);
      }
      this.cachedFields[key].onChange(model[key]);
    }
    this.onUpdate();
  }

  public get fields(): MappedFields<T> {
    const handler = {
      get: (target: MappedFields<T>, key: string) => {
        if (!target[key]) {
          this.addField(key);
        }

        return {
          ...this.cachedFields[key],
          onChange: this.cachedFields[key].onChange?.bind(
            this.cachedFields[key]
          ),
          onBlur: this.cachedFields[key].onBlur?.bind(this.cachedFields[key]),
          valid: this.cachedFields[key].valid,
          dirty: this.cachedFields[key].dirty,
        };
      },
    };

    return new Proxy(this.cachedFields, handler);
  }

  public validateFields(messages?: CustomValidationMessages): void {
    for (const key in this.validations) {
      const field = this.cachedFields[key];

      if (field) {
        field.validate({
          model: {
            ...this.model,
            ...this.getChanges(),
          },
          validation: this.validations?.[key],
          messages,
        });
      }
    }
  }

  public onUpdate(): void {
    this.validateFields();
    this.cachedOnUpdate();
  }
}

interface UseFormProps<T> {
  model: T;
  handleSubmit?: () => void | Promise<void>;
  validations?: Partial<MappedValidation<T>>;
}

// The actual hook
export function useForm<T>({
  model,
  handleSubmit,
  validations,
}: UseFormProps<T>): FormModel<T> {
  const onUpdate = useForceUpdate();
  const formRef = useRef<Form<T> | null>(null);
  if (!formRef.current) {
    formRef.current = new Form({
      model,
      onUpdate,
      validations,
      handleSubmit,
    });
  }
  const form = formRef.current;

  const changes = form.getChanges();

  return {
    model: { ...model, ...changes },
    fields: form.fields,
    changes,
    dirty: !isEmpty(changes),
    valid: form.valid,
    submitError: form.submitError,
    submitting: form.loading,
    onSubmit: form.onSubmit,
    reset: form.reset.bind(form),
    updateFields: form.updateFields.bind(form),
  };
}
