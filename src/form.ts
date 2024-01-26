import { MappedValidation } from './validation';
import { Field, FieldImplementation, MappedFields } from './field';

export type SubmissionStatus = 'submitting' | 'error' | 'submitted' | 'idle';

export class Form<T> {
  error: Error | undefined;
  submissionStatus: SubmissionStatus = 'idle';
  onSubmit?: (form: Form<T>) => void | Promise<void>;
  onSubmitError: ((error: Error) => void) | undefined;
  #validations: MappedValidation<T>;
  #field: FieldImplementation<T, T>;
  #onChange?: (form: Form<T>) => void;
  #onUpdate?: () => void;

  constructor({
    model,
    onUpdate,
    validations,
    onSubmit,
    onSubmitError,
    onInit,
    onChange,
  }: {
    model: T;
    validations?: MappedValidation<T>;
    onUpdate?: () => void;
    onSubmit?: (form: Form<T>) => void | Promise<void>;
    onSubmitError?: (error: Error) => void;
    onInit?: (form: Form<T>) => void;
    onChange?: (form: Form<T>) => void;
  }) {
    this.#validations = validations ?? {};
    this.#field = new FieldImplementation<T, T>({
      value: model,
      originalValue: model,
      onUpdate: this.onUpdate.bind(this),
      validations: this.#validations,
      getModel: () => this.model,
    });
    onInit?.(this);
    this.validate(); // called before assigning the callbacks so the outside world is not called during initialization
    this.#onUpdate = onUpdate;
    this.onSubmit = onSubmit;
    this.onSubmitError = onSubmitError;
    this.#onChange = onChange;
  }

  // This method will touch every field, for the purpose of displaying the errors in the view
  touch(): void {
    this.#field.touch();
  }

  // onSubmit method is a wrapper around the handleSubmit param passed to the constructor.
  // It handles the loading state and executes the handleSubmit function if it is defined.
  async submit(e?: { preventDefault: () => void }): Promise<void> {
    e?.preventDefault();

    this.touch();
    if (!this.#field.valid) {
      this.#onUpdate?.();
      return;
    }
    this.submissionStatus = 'submitting';
    this.#onUpdate?.();
    if (this.onSubmit) {
      try {
        await this.onSubmit(this);
        this.submissionStatus = 'submitted';
        this.#onUpdate?.();
      } catch (error) {
        if (error instanceof Error) {
          this.error = error;
          this.submissionStatus = 'error';
          this.#onUpdate?.();
          if (this.onSubmitError) {
            this.onSubmitError(error);
          } else {
            throw error;
          }
        }
      }
    }
  }

  // Reset function will clear the value of every field
  reset(): void {
    this.#field.reset();
  }

  // Reset function to reset error state
  resetError(): void {
    if (this.error) {
      this.error = undefined;
      this.onUpdate();
    }
  }

  // Mass update method.
  updateFields(model: Partial<T>): void {
    Object.keys(model).forEach((key) => {
      const field: Field<unknown> = this.fields[key];
      field.onChange(model[key]);
    });
    this.onUpdate();
  }

  validate(): void {
    this.#field.validate();
  }

  // The changes object contains only the keys of fields which are dirty (value !== originalValue)
  get changes(): Partial<T> {
    const changes: Partial<T> = {};

    for (const key in this.fields) {
      const field = this.fields[key];
      if (field.dirty) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changes[key] = field.value as any;
      }
    }

    return changes;
  }

  // The exposed updated model contains both the original model and the changes object on top
  get model(): T {
    return this.#field.value;
  }

  updateOriginalModel(value: Partial<T>): void {
    this.#field.updateOriginalValue(value);
  }

  get dirty(): boolean {
    return this.#field.dirty;
  }

  get valid(): boolean {
    return this.#field.valid;
  }

  get fields(): MappedFields<T> {
    return this.#field.fields;
  }

  private onUpdate(): void {
    this.validate();
    if (
      this.submissionStatus === 'error' ||
      this.submissionStatus === 'submitted'
    ) {
      this.submissionStatus = 'idle';
    }
    this.#onChange?.(this);
    this.#onUpdate?.();
  }
}
