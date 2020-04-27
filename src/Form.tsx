import React, { useState, useRef } from 'react';
import isEmpty from 'lodash.isempty';
import { useForceUpdate } from './util';
import { FormField } from './FormField';
import { MappedValidation, CustomValidationMessages } from './validation';
import { MappedFields, FormModel } from './types';

class Form<T> {
  private model: T;
  public fields = {} as MappedFields<T>;
  private validations?: Partial<MappedValidation<T>>;
  private onUpdate: () => void;

  constructor(
    model: T,
    onUpdate: () => void,
    validations?: Partial<MappedValidation<T>>
  ) {
    this.model = model;
    this.onUpdate = onUpdate;
    this.validations = validations;

    for (const key in model) {
      this.addField(key);
    }
  }

  // Changes are tracked comparing the new value agains the original passed from the model
  public getChanges(): Partial<T> {
    const changes = {} as Partial<T>;

    for (const key in this.fields) {
      const field = this.fields[key];
      if (field.value !== this.model[key]) {
        changes[key] = field.value;
      }
    }

    return changes;
  }

  // A valid form needs all of its fields to be touched and have no errors
  public get valid(): boolean {
    return Object.keys(this.fields).every((key) => {
      return this.fields[key].valid;
    });
  }

  public addField(key: string): void {
    this.fields[key] = new FormField({
      name: key,
      value: this.model[key],
      required: this.validations?.[key]?.includes('required'),
      onUpdate: this.onUpdate,
    });
  }

  public touchFields(): void {
    for (const key in this.fields) {
      this.fields[key].touched = true;
    }
  }

  public resetForm(): void {
    for (const key in this.fields) {
      this.fields[key].value = undefined;
    }
  }

  public updateFields(model: Partial<T>): void {
    for (const key in model) {
      // Necessary to update fields that don't exist yet, due to conditional rendering
      if (!this.fields[key]) {
        this.addField(key);
      }
      this.fields[key].onChange(model[key]);
    }
    this.onUpdate();
  }

  public getFields(): MappedFields<T> {
    const handler = {
      get: (target: MappedFields<T>, key: string) => {
        if (!target[key]) {
          this.addField(key);
        }

        return {
          ...this.fields[key],
          onChange: this.fields[key].onChange?.bind(this.fields[key]),
          onBlur: this.fields[key].onBlur?.bind(this.fields[key]),
          valid: this.fields[key].valid,
        };
      },
    };

    return new Proxy(this.fields, handler);
  }

  public validateFields(messages?: CustomValidationMessages): void {
    for (const key in this.validations) {
      const field = this.fields[key];

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
}

interface UseFormProps<T> {
  model: T;
  handleSubmit?: () => Promise<void>;
  validations?: Partial<MappedValidation<T>>;
  validationMessages?: CustomValidationMessages;
}

// The actual hook
export function useForm<T>({
  model,
  handleSubmit,
  validations,
  validationMessages,
}: UseFormProps<T>): FormModel<T> {
  const forceUpdate = useForceUpdate();
  const formRef = useRef<Form<T> | null>(null);
  if (!formRef.current) {
    formRef.current = new Form(model, forceUpdate, validations);
  }
  const form = formRef.current;

  // Loading state
  const [submitting, setSubmitting] = useState(false);
  // Error tracking
  const [submitError, setSubmitError] = useState<Error | undefined>(undefined);

  async function onSubmit(e?: React.FormEvent<HTMLFormElement>): Promise<void> {
    if (e) {
      e.preventDefault();
    }
    setSubmitting(true);
    form.touchFields();
    try {
      if (handleSubmit) {
        await handleSubmit();
      }
    } catch (error) {
      setSubmitError(error);
    }
    setSubmitting(false);
  }

  const changes = form.getChanges();

  form.validateFields(validationMessages);

  return {
    model: { ...model, ...changes },
    fields: form.getFields(),
    changes,
    dirty: !isEmpty(changes),
    valid: form.valid,
    submitError,
    submitting,
    onSubmit,
    resetForm: form.resetForm.bind(form),
    updateFields: form.updateFields.bind(form),
  };
}
