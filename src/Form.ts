import React, { useRef } from 'react';
import isEmpty from 'lodash.isempty';
import { useForceUpdate } from './util';
import { FormField } from './FormField';
import {
  MappedFields,
  MappedValidation,
  UseFormProps,
  FormModel,
} from './types';

export class Form<T> {
  // CLASS PROPERTIES
  // Original model
  private originalModel: T;
  // Cached fields created with addField().
  private cachedFields = {} as MappedFields<T>;
  // OnUpdate function used to update the view after any changes
  private cachedOnUpdate: () => void;
  // Form submit function
  private handleSubmit: (() => void | Promise<void>) | undefined;
  // Loading state for submit function
  public submitting = false;
  // Any errors on submit are stored here
  public submitError: Error | undefined = undefined;
  // Vaidations object
  public validations?: Partial<MappedValidation<T>>;

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

    // A new field will be created for every key in the model.
    // Any field that is not present in the original model will be created on demand within the fields getter
    for (const key in model) {
      this.addField(key);
    }
  }

  // CLASS METHODS
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

  // This method will touch every field, for the purpose of displaying the errors in the view
  public touchFields(): void {
    for (const key in this.cachedFields) {
      this.cachedFields[key].touched = true;
    }
  }

  // onSubmit method is a wrapper around the handleSubmit param passed to the constructor.
  // It handles the loading state and saves any error to the submitError property.
  public async onSubmit(e?: React.FormEvent<HTMLFormElement>): Promise<void> {
    if (e) {
      e.preventDefault();
    }
    this.submitting = true;
    this.cachedOnUpdate();
    // Touch fields to display errors
    this.touchFields();
    try {
      if (this.handleSubmit) {
        await this.handleSubmit();
      }
    } catch (error) {
      this.submitError = error;
    }
    this.submitting = false;
    this.cachedOnUpdate();
  }

  // Reset function will clear the value of every field
  public reset(): void {
    for (const key in this.cachedFields) {
      this.cachedFields[key].reset();
    }
  }

  // Mass update method.
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

  // CLASS GETTERS
  // The changes object contains only the keys of fields which are dirty (value !== originalValue)
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

  // The exposed updated model contains both the original model and the changes object on top
  public get model(): T {
    return {
      ...this.originalModel,
      ...this.changes,
    };
  }

  // A form is dirty only if it has any changes
  public get dirty(): boolean {
    return !isEmpty(this.changes);
  }

  public get valid(): boolean {
    // If there are no validations, forms are valid by default.
    if (!this.validations) {
      return true;
    }
    // A form is valid if all required fields are valid
    return Object.keys(this.validations).every((key) => {
      return this.fields[key].required ? this.fields[key].valid : true;
    });
  }

  // Fields getter uses a proxy object to generate fields on demand. It also binds the instance methods.
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
}

// The actual hook
export function useForm<T>({
  model,
  handleSubmit,
  validations,
}: UseFormProps<T>): FormModel<T> {
  // Using a custom hook to call a rerender on every change
  const onUpdate = useForceUpdate();
  // Saving the form in a ref, to have only 1 instance throghout the lifetime of the hook
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
    submitting: form.submitting,
    onSubmit: form.onSubmit.bind(form),
    reset: form.reset.bind(form),
  };
}
