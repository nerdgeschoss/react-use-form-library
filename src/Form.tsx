import React, { useRef } from 'react';
import isEmpty from 'lodash.isempty';
import { useForceUpdate } from './util';
import { FormField } from './FormField';
import { MappedValidation } from './validation';
import { MappedFields, FormModel } from './types';

export class Form<T> {
  private originalModel: T;
  private cachedFields = {} as MappedFields<T>;
  private cachedOnUpdate: () => void;
  private handleSubmit: (() => void | Promise<void>) | undefined;
  public validations?: Partial<MappedValidation<T>>;
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
    this.originalModel = model;
    this.cachedOnUpdate = onUpdate;
    this.validations = validations;
    this.handleSubmit = handleSubmit;

    for (const key in model) {
      this.addField(key);
    }
  }

  // Changes are tracked comparing the new value agains the original passed from the model
  public get changes(): Partial<T> {
    const changes = {} as Partial<T>;

    for (const key in this.cachedFields) {
      const field = this.cachedFields[key];
      if (field.dirty) {
        changes[key] = field.value;
      }
    }

    return changes;
  }
  public get model(): T {
    return {
      ...this.originalModel,
      ...this.changes,
    };
  }
  public get dirty(): boolean {
    return !isEmpty(this.changes);
  }

  // A valid form needs all of its fields to be touched and have no errors
  public get valid(): boolean {
    if (!this.validations) {
      return true;
    }
    return Object.keys(this.validations).every((key) => {
      return this.fields[key].required ? this.fields[key].valid : true;
    });
  }

  public addField(key: string): void {
    this.cachedFields[key] = new FormField({
      name: key,
      value: this.originalModel[key],
      onUpdate: this.onUpdate.bind(this),
      validation: this.validations?.[key],
    });
    if (this.cachedFields[key].required) {
      this.cachedFields[key].validate(this.model);
    }
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
          this.validateFields();
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

  private validateFields(): void {
    for (const key in this.validations) {
      const field = this.cachedFields[key];

      if (field) {
        field.validate(this.model);
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

  return {
    model: form.model,
    fields: form.fields,
    changes: form.changes,
    dirty: form.dirty,
    valid: form.valid,
    submitError: form.submitError,
    submitting: form.loading,
    onSubmit: form.onSubmit.bind(form),
    reset: form.reset.bind(form),
  };
}
