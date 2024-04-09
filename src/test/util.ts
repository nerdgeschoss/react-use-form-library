import { Form } from '../form';
import { MappedValidation } from '../validation';

export interface Model {
  name: string | null;
  age: number;
  description?: string;
  nullableValue: string | { id: string } | null;
  emails?: string[];
  address?: {
    streetName?: string;
    streetNumber?: number;
  };
  optionalContent?: {
    name?: string;
  };
  hobbies: Array<{ name: string }>;
  json?: unknown;
  dateValue?: Date;
  confirmed?: boolean;
}

class UpdateTracker {
  wasCalled = false;
  submitted: Model | null = null;

  onUpdate: VoidFunction = () => {
    this.wasCalled = true;
  };

  reset: VoidFunction = () => {
    this.wasCalled = false;
    this.submitted = null;
  };

  onSubmit: (value: Form<Model>) => void = (form) => {
    this.submitted = form.model;
  };
}

export const tracker = new UpdateTracker();

const defaultValue: Model = {
  name: '',
  age: 18,
  nullableValue: null,
  hobbies: [],
};

export function createForm({
  validations,
  value,
  onSubmit,
  onSubmitError,
  onInit,
  onChange,
}: {
  value?: Partial<Model>;
  validations?: Partial<MappedValidation<Model>>;
  onSubmit?: (form: Form<Model>) => Promise<void> | void;
  onSubmitError?: (error: Error) => void;
  onInit?: (form: Form<Model>) => void;
  onChange?: (form: Form<Model>) => void;
} = {}): Form<Model> {
  return new Form<Model>({
    model: { ...defaultValue, ...(value || {}) },
    validations,
    onUpdate: tracker.onUpdate,
    onSubmit: onSubmit ?? tracker.onSubmit,
    onSubmitError,
    onInit,
    onChange,
  });
}
