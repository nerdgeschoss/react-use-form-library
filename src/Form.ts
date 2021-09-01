import { FormField } from './FormField';
import { MappedValidation } from './validation';
import { FieldSet } from './FieldSet';
import { isEmpty } from './util';

/* This type is used to take a model, parse it an return a different type
for each field. In this case, for each field of T, string | number you
get back a FormField type */
export type MappedFields<T> = {
  // Here we are only checking if T[P] is actually an array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof Required<T>]: T[P] extends any[]
    ? FieldSet<T[P]>
    : FormField<T[P]>;
};

export type SubmissionStatus = 'submitting' | 'error' | 'submitted' | 'idle';

export class Form<T> {
  // CLASS PROPERTIES
  // Original model
  private originalModel: T;
  // Cached fields created with addField().
  private cachedFields = {} as MappedFields<T>;
  // OnUpdate function used to update the view after any changes
  private cachedOnUpdate: () => void;
  // Form submit function
  public handleSubmit: ((form: Form<T>) => void | Promise<void>) | undefined;
  // Loading state for submit function
  public submissionStatus: SubmissionStatus = 'idle';
  // Validations object
  private validations?: Partial<MappedValidation<T>>;
  // Error handling
  public error: Error | undefined;
  // Function for custom error handling
  public onSubmitError: ((error: Error) => void) | undefined;

  constructor({
    model,
    onUpdate,
    validations,
    handleSubmit,
    onSubmitError,
  }: {
    model: T;
    onUpdate: () => void;
    validations?: Partial<MappedValidation<T>>;
    handleSubmit?: (form: Form<T>) => void | Promise<void>;
    onSubmitError?: (error: Error) => void;
  }) {
    this.originalModel = model;
    this.cachedOnUpdate = onUpdate;
    this.validations = validations;
    this.handleSubmit = handleSubmit;
    this.onSubmitError = onSubmitError;
  }

  // This method will touch every field, for the purpose of displaying the errors in the view
  public touchFields(): void {
    for (const key in this.fields) {
      this.fields[key].setTouched(true);
    }
  }

  // onSubmit method is a wrapper around the handleSubmit param passed to the constructor.
  // It handles the loading state and executes the handleSubmit function if it is defined.
  public async onSubmit(e?: React.FormEvent<HTMLFormElement>): Promise<void> {
    if (e) {
      e.preventDefault();
    }
    // Touch fields to display errors
    this.touchFields();
    this.updateSubmissionStatus('submitting');
    if (this.handleSubmit) {
      try {
        await this.handleSubmit(this);
        this.updateSubmissionStatus('submitted');
      } catch (error) {
        this.error = error;
        if (this.onSubmitError) {
          this.onSubmitError(error);
        } else {
          throw error;
        }
        this.updateSubmissionStatus('error');
      }
    }
  }

  // Reset function will clear the value of every field
  public reset(): void {
    for (const key in this.fields) {
      this.fields[key].reset();
      this.fields[key].validate(this.model);
    }
    this.updateSubmissionStatus('idle');
  }

  // Reset function to reset error state
  public resetError(): void {
    if (this.error) {
      this.error = undefined;
      this.updateSubmissionStatus('idle');
    }
  }

  // Mass update method.
  public updateFields(model: Partial<T>): void {
    for (const key in model) {
      this.fields[key].onChange(model[key], true);
    }
    this.onUpdate();
  }

  private validateFields(): void {
    for (const key in this.fields) {
      const field = this.fields[key];

      if (field) {
        field.validate(this.model);
      }
    }
  }

  public onUpdate(): void {
    this.validateFields();
    // Reset submission status if there are new changes
    if (
      this.submissionStatus === 'error' ||
      this.submissionStatus === 'submitted'
    ) {
      this.updateSubmissionStatus('idle');
    } else {
      this.cachedOnUpdate();
    }
  }

  private updateSubmissionStatus(status: SubmissionStatus): void {
    this.submissionStatus = status;
    this.cachedOnUpdate();
  }

  // CLASS GETTERS
  // The changes object contains only the keys of fields which are dirty (value !== originalValue)
  public get changes(): Partial<T> {
    const changes = {} as Partial<T>;

    for (const key in this.fields) {
      const field = this.fields[key];
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
    if (!this.validations || Object.keys(this.validations).length === 0) {
      return true;
    }
    // A form is valid if all fields are valid
    return Object.keys(this.validations).every((key) => {
      return this.fields[key].valid;
    });
  }

  // can submit
  public get canSubmit(): boolean {
    return this.valid && this.dirty;
  }

  private addField(key: string): void {
    const options = {
      value: this.originalModel[key],
      onUpdate: this.onUpdate.bind(this),
      validation: this.validations?.[key],
    };
    if (Array.isArray(this.originalModel[key])) {
      this.cachedFields[key] = new FieldSet(options);
    } else {
      this.cachedFields[key] = new FormField(options);
    }
    this.cachedFields[key].validate(this.model);
  }

  // Fields getter uses a proxy object to generate fields on demand. It also binds the instance methods.
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
}
