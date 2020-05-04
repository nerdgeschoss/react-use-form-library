import { Form } from './Form';
import { FormEvent } from 'react';
import { MappedValidation } from './validation';

type VoidFunction = () => void;

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

const tracker = new UpdateTracker();

interface Model {
  name: string;
  age: number;
  description?: string;
}

function createForm({
  validations,
  value,
  onSubmit,
}: {
  value?: Partial<Model>;
  validations?: Partial<MappedValidation<Model>>;
  onSubmit?: (form: Form<Model>) => Promise<void> | void;
} = {}): Form<Model> {
  const defaultValue = { name: '', age: 18 };
  return new Form<Model>({
    model: { ...defaultValue, ...(value || {}) },
    onUpdate: tracker.onUpdate,
    handleSubmit: onSubmit ?? tracker.onSubmit,
    validations,
  });
}

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('instantiation', () => {
    const form = createForm();
    it('creates an empty field name', () => {
      expect(form.fields.name).toBeTruthy();
      expect(form.fields.name.value).toBeFalsy();
      expect(form.fields.name.dirty).toBeFalsy();
    });
    it('creates an pre filled field age', () => {
      expect(form.fields.age).toBeTruthy();
      expect(form.fields.age.value).toBeTruthy();
      expect(form.fields.age.dirty).toBeFalsy();
    });
  });

  describe('tracking changes', () => {
    it('returns the updated model', () => {
      const form = createForm();
      expect(form.changes).toEqual({});
      form.fields.name.onChange('test');
      expect(Object.keys(form.changes).includes('name')).toBeTruthy();
      expect(form.model.name).toBe('test');
    });

    it('is dirty only when there are changes', () => {
      const form = createForm();
      expect(form.dirty).toBeFalsy();
      form.fields.name.onChange('test');
      expect(form.dirty).toBeTruthy();
    });

    it('invokes the callback when a value changes', () => {
      const form = createForm();
      expect(form.fields.name.dirty).toBeFalsy();
      expect(form.fields.name.touched).toBeFalsy();
      form.fields.name.onChange('Freddy');
      expect(form.fields.name.dirty).toBeTruthy();
      expect(form.fields.name.touched).toBeTruthy();
      expect(tracker.wasCalled).toBeTruthy();
    });

    it('invokes the callback for undefined values', () => {
      const form = createForm();
      expect(form.fields.description).toBeDefined();
      expect(form.fields.description.value).toBeUndefined();
      expect(tracker.wasCalled).toBeFalsy();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      form.fields.description.onChange('Test description');
      expect(tracker.wasCalled).toBeTruthy();
    });

    it('resets', () => {
      const form = createForm();
      form.fields.name.onChange('hello');
      form.reset();
      expect(form.changes).toEqual({});
    });

    it('mass assigns', () => {
      const form = createForm();
      form.updateFields({ name: 'George', age: 5 });
      expect(form.changes).toEqual({ name: 'George', age: 5 });
    });

    it("doesn't track same value as a change", () => {
      const form = createForm();
      form.fields.age.onChange(18);
      expect(form.fields.name.dirty).toBeFalsy();
      expect(form.changes).toEqual({});
    });
  });

  describe('validation', () => {
    it('uses built in required validations', () => {
      const form = createForm({
        validations: { name: 'required' },
      });
      expect(form.fields.name.required).toBeTruthy();
      expect(form.fields.name.valid).toBeFalsy();
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('');
      expect(form.fields.name.valid).toBeFalsy();
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('Freddy');
      expect(form.fields.name.valid).toBeTruthy();
      expect(form.valid).toBeTruthy();
    });

    it('ignores validations on non required', () => {
      const form = createForm({
        value: { name: '' },
        validations: { name: ['email'] },
      });
      expect(form.fields.name.valid).toBeTruthy();
      expect(form.valid).toBeTruthy();
      form.fields.name.onChange('test');
      expect(form.fields.name.valid).toBeFalsy();
      expect(form.valid).toBeFalsy();
    });

    it('uses a built in email validation', () => {
      const form = createForm({
        validations: { name: ['email', 'required'] },
      });
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('test@example.com');
      expect(form.valid).toBeTruthy();
    });

    it('uses a custom validation function', () => {
      const form = createForm({
        validations: { name: [() => ['custom error']] },
      });
      expect(form.fields.name.valid).toBeFalsy();
      expect(form.fields.name.errors).toEqual(['custom error']);
    });
  });

  describe('submitting', () => {
    it('prevents the event default', () => {
      const mock = jest.fn();
      const submitEvent = ({ preventDefault: mock } as unknown) as FormEvent<
        HTMLFormElement
      >;
      const form = createForm();
      form.onSubmit(submitEvent);
      expect(mock).toBeCalled();
    });

    it('invokes the submit handler if all fields are valid', () => {
      const form = createForm();
      expect(tracker.submitted).toBeFalsy();
      form.onSubmit();
      expect(tracker.submitted).toBeTruthy();
    });

    it('touches fields', () => {
      const form = createForm();
      expect(form.fields.name.touched).toBeFalsy();
      form.onSubmit();
      expect(form.fields.name.touched).toBeTruthy();
    });

    it('handles async functions', async () => {
      const form = createForm({
        onSubmit: async (form) => {
          expect(form.submitting).toBeTruthy();
        },
      });
      await form.onSubmit();
      expect(form.submitting).toBeFalsy();
      expect(form.submitError).toBeUndefined();
    });

    it('handles errors from async functions', async () => {
      const form = createForm({
        onSubmit: async () => {
          throw new Error('failed to submit');
        },
      });
      await form.onSubmit();
      expect(form.submitting).toBeFalsy();
      expect(form.submitError).toBeDefined();
    });
  });
});
