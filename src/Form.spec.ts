import { Form } from './Form';
import { FormEvent } from 'react';
import { MappedValidation } from './validation';
import { FormField } from './FormField';
import { FieldSet } from './FieldSet';

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
  nullableValue?: string | null;
  emails?: string[];
  address?: {
    streetName: string;
    streetNumber: number;
  };
  avatar?: {
    url: string;
  } | null;
}

function createForm({
  validations,
  value,
  onSubmit,
  onSubmitError,
}: {
  value?: Partial<Model>;
  validations?: Partial<MappedValidation<Model>>;
  onSubmit?: (form: Form<Model>) => Promise<void> | void;
  onSubmitError?: (error: Error) => void;
} = {}): Form<Model> {
  const defaultValue = { name: '', age: 18 };
  return new Form<Model>({
    model: { ...defaultValue, ...(value || {}) },
    onUpdate: tracker.onUpdate,
    handleSubmit: onSubmit ?? tracker.onSubmit,
    onSubmitError,
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
      expect(form.fields.name.isDirty()).toBeFalsy();
    });
    it('creates an pre filled field age', () => {
      expect(form.fields.age).toBeTruthy();
      expect(form.fields.age.value).toBeTruthy();
      expect(form.fields.age.isDirty()).toBeFalsy();
    });
    it('can be destructured', () => {
      const { valid, onChange, onBlur, onFocus } = form.fields.age;
      expect(valid).toEqual(true);
      expect(onChange).toBeDefined();
      expect(onFocus).toBeDefined();
      expect(onBlur).toBeDefined();
    });
    it('can create fields from null value', () => {
      const form2 = createForm({
        value: {
          nullableValue: null,
        },
      });
      expect(form2.fields.nullableValue.value).toBeNull();
      form2.fields.nullableValue.onChange('test');
      expect(form2.fields.nullableValue.value).toBe('test');
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
      expect(form.fields.name.isDirty()).toBeFalsy();
      expect(form.fields.name.isTouched()).toBeFalsy();
      form.fields.name.onChange('Freddy');
      expect(form.fields.name.isDirty()).toBeTruthy();
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

    it('mass assigns', () => {
      const form = createForm();
      form.updateFields({ name: 'George', age: 5 });
      expect(form.changes).toEqual({ name: 'George', age: 5 });
    });

    it("doesn't track same value as a change", () => {
      const form = createForm();
      form.fields.age.onChange(18);
      expect(form.fields.name.isDirty()).toBeFalsy();
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

    it('uses a custom validation function', () => {
      const form = createForm({
        validations: { name: [() => ['custom error']] },
      });
      expect(form.fields.name.valid).toBeFalsy();
      expect(form.fields.name.errors).toEqual(['custom error']);
    });

    it('uses a custom regex for validation', () => {
      const form = createForm({
        validations: { name: /[a-g]/ },
      });
      form.fields.name.onChange('xyz');
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('ade');
      expect(form.valid).toBeTruthy();
    });
  });

  describe('pre-defined validation', () => {
    it('validates a required field', () => {
      const form = createForm({
        validations: { name: 'required' },
      });
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('test');
      expect(form.valid).toBeTruthy();
    });
    it('validates an email field', () => {
      const form = createForm({
        validations: { name: 'email' },
      });
      form.fields.name.onChange('test');
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('test@example.com');
      expect(form.valid).toBeTruthy();
    });
    it('validates a json field', () => {
      const form = createForm({
        validations: { name: 'json' },
      });
      form.fields.name.onChange('test');
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('{ "foo": "baz"}');
      expect(form.valid).toBeTruthy();
    });
    it('validates a website field', () => {
      const form = createForm({
        validations: { name: 'website' },
      });
      form.fields.name.onChange('test');
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('https://google.com');
      expect(form.valid).toBeTruthy();
    });
    it('validates a number field', () => {
      const form = createForm({
        validations: { age: 'number' },
      });
      // eslint-disable-next-line
      // @ts-ignore
      form.fields.age.onChange('test');
      expect(form.valid).toBeFalsy();
      form.fields.age.onChange(12);
      expect(form.valid).toBeTruthy();
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
      expect(form.fields.name.isTouched()).toBeFalsy();
      form.onSubmit();
      expect(form.fields.name.isTouched()).toBeTruthy();
    });

    it('can submit with null value', async () => {
      const form2 = createForm({
        value: {
          nullableValue: null,
        },
      });
      expect(form2.fields.nullableValue.value).toBeNull();
      await form2.onSubmit();
    });

    it('handles async functions', async () => {
      const form = createForm({
        onSubmit: async (form) => {
          expect(form.submissionStatus).toBe('submitting');
        },
      });
      expect(form.submissionStatus).toBe('idle');
      await form.onSubmit();
      expect(form.submissionStatus).toBe('submitted');
    });

    it('handles error', async () => {
      let error = null;
      const form = createForm({
        onSubmit: async (form) => {
          expect(form.submissionStatus).toBe('submitting');
          throw new Error('');
        },
        onSubmitError: (e: Error) => {
          error = e;
        },
      });
      await form.onSubmit();
      expect(form.submissionStatus).toBe('error');
      expect(form.error).toBeTruthy();
      // Custom error handling
      expect(error).toBeTruthy();
    });
  });

  describe('reseting', () => {
    it('resets fields', () => {
      const form = createForm();
      form.fields.name.onChange('hello');
      form.reset();
      expect(form.changes).toEqual({});
    });

    it('resets error', async () => {
      const form = createForm({
        onSubmit: async (form) => {
          expect(form.submissionStatus).toBe('submitting');
          throw new Error('');
        },
        onSubmitError: () => {
          // do nothing;
        },
      });
      await form.onSubmit();
      // Reset error
      form.resetError();
      expect(form.submissionStatus).toBe('idle');
      expect(form.error).toBeUndefined();
    });

    it('resets valid and dirty fields', () => {
      const form = createForm({
        validations: { name: 'required' },
      });
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('test');
      expect(form.valid).toBeTruthy();

      form.reset();
      expect(form.valid).toEqual(false);
      expect(form.dirty).toEqual(false);
    });
    it('resets to idle if there are new changes after submitted', async () => {
      const form = createForm({});
      expect(form.submissionStatus).toEqual('idle');
      await form.onSubmit();
      expect(form.submissionStatus).toEqual('submitted');
      form.fields.name.onChange('test');
      expect(form.submissionStatus).toEqual('idle');
    });
    it('resets to idle if there are new changes after submit error', async () => {
      const form = createForm({
        onSubmit: async () => {
          throw new Error('');
        },
        onSubmitError: () => {
          // do nothing;
        },
      });
      await form.onSubmit();
      expect(form.submissionStatus).toBe('error');
      form.fields.name.onChange('test');
      expect(form.submissionStatus).toEqual('idle');
    });
    it('sets value to null', () => {
      const form = createForm();
      form.fields.avatar.fields?.url.onChange('test-image');
      expect(form.fields.avatar.fields?.url.value).toBe('test-image');
      form.fields.avatar.onChange(null);
      expect(form.fields.avatar.value).toBe(null);
    });
  });

  describe('fields array', () => {
    // CREATE
    it('creates empty array', () => {
      const form = createForm({
        value: { emails: [] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(Array.isArray(emails.fields)).toEqual(true);
      expect(emails.fields?.length).toEqual(0);
    });
    it('adds a new field', () => {
      const form = createForm({
        value: { emails: [] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails.fields.length).toEqual(0);
      emails.insert('test');
      expect(emails.fields.length).toEqual(1);
      expect(emails.fields[0].value).toEqual('test');
    });
    it('adds multiple fields', () => {
      const form = createForm({
        value: { emails: [] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails.fields.length).toEqual(0);
      const newFields = ['test', 'test', 'test'];
      emails.insert(...newFields);
      expect(emails.fields.length).toEqual(3);
      expect(emails.fields[0].value).toEqual('test');
    });
    it('creates FormField for each element of the array', () => {
      const form = createForm({
        value: { emails: ['google.com', 'facebook.com'] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails instanceof FieldSet).toBeTruthy();
      expect(emails.fields[0] instanceof FormField).toBeTruthy();
      expect(emails.fields[1] instanceof FormField).toBeTruthy();
      expect(emails.fields[0].value).toEqual('google.com');
      expect(emails.fields[1].value).toEqual('facebook.com');
    });
    // UPDATE
    it('updates every field', () => {
      const form = createForm({
        value: { emails: ['google.com', 'facebook.com'] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      emails.onChange(['linkedin.com', 'twitter.com']);
      expect(emails.fields[0].value).toEqual('linkedin.com');
      expect(emails.fields[1].value).toEqual('twitter.com');
    });
    it('creates new fields when mass updating', () => {
      const form = createForm({
        value: { emails: [] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      emails.onChange(['linkedin.com', 'twitter.com']);
      expect(emails.fields[0].value).toEqual('linkedin.com');
      expect(emails.fields[1].value).toEqual('twitter.com');
    });
    it('resets all fields', () => {
      const form = createForm({
        value: { emails: ['google.com', 'facebook.com'] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      emails.fields[0].onChange('linkedin.com');
      emails.fields[1].onChange('twitter.com');
      emails.reset();
      expect(emails.fields[0].value).toEqual('google.com');
      expect(emails.fields[1].value).toEqual('facebook.com');
    });
    it('touches every field', () => {
      const form = createForm({
        value: { emails: ['google.com', 'facebook.com'] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails.fields[0].isTouched()).toEqual(false);
      emails.setTouched(true);
      expect(emails.fields[0].isTouched()).toEqual(true);
      expect(emails.isTouched()).toEqual(true);
    });
    // DELETE
    it('removes a field', () => {
      const form = createForm({
        value: { emails: [] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails.fields.length).toEqual(0);
      emails.insert('test');
      expect(emails.fields.length).toEqual(1);
      emails.fields[0].remove();
      expect(emails.fields.length).toEqual(0);
    });
    // Validation
    it('validates fields', () => {
      const form = createForm({
        value: { emails: ['google@gmail.com', 'facebook@gmail.com'] },
        validations: {
          emails: 'email',
        },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      emails.fields[0].onChange('test');
      expect(emails.fields[0].valid).toEqual(false);
      emails.fields[1].onChange('test');
      expect(emails.fields[1].valid).toEqual(false);
    });
    it('has the correct value', () => {
      const form = createForm({
        value: { emails: ['google.com', 'facebook.com'] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      emails.onChange(['linkedin.com', 'twitter.com']);
      expect(emails.value.length).toEqual(2);
      expect(emails.value[0]).toEqual('linkedin.com');
      expect(emails.value[1]).toEqual('twitter.com');
    });
    it('is dirty', () => {
      const form = createForm({
        value: { emails: ['google.com', 'facebook.com'] },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails.isDirty()).toBeFalsy();
      emails.fields[0].onChange('linkedin.com');
      expect(emails.fields[0].isDirty()).toBeTruthy();
      expect(emails.fields[1].isDirty()).toBeFalsy();
      expect(emails.isDirty()).toBeTruthy();
    });
    it("is valid when it has at least one field if it's required", () => {
      const form = createForm({
        value: { emails: [] },
        validations: {
          emails: 'required',
        },
      });
      const emails = (form.fields.emails as unknown) as FieldSet<string[]>;

      expect(emails.valid).toBeFalsy();
      emails.insert('test');
      expect(emails.valid).toBeTruthy();
    });
  });

  describe('nested objects', () => {
    it('creates FormField for a 1 level nested field', () => {
      const form = createForm();
      expect(form.fields.address instanceof FormField);
      expect(form.fields.address.fields?.streetNumber instanceof FormField);
    });
    it('updates the value after changing nested fields', () => {
      const form = createForm();
      expect(form.fields.address.value).toBeFalsy();
      form.fields.address.fields?.streetName.onChange('Test Address 123');
      expect(form.fields.address.value?.streetName).toEqual('Test Address 123');
    });
    it('mass updates fields', () => {
      const form = createForm();
      form.fields.address.onChange({
        streetName: 'Test Address',
        streetNumber: 23,
      });
      expect(form.fields.address.fields?.streetName.value).toEqual(
        'Test Address'
      );
      expect(form.fields.address.fields?.streetNumber.value).toEqual(23);
    });
    it('validates every field', () => {
      const form = createForm({
        value: {
          address: {
            streetName: 'Test Address',
            streetNumber: 23,
          },
        },
        validations: {
          address: {
            streetName: 'required',
            streetNumber: 'number',
          },
        },
      });

      form.fields.address.validate(form.model);
      expect(form.fields.address.fields?.streetName.valid).toBeTruthy();
      form.fields.address.fields?.streetName.onChange('');
      expect(form.fields.address.fields?.streetName.valid).toBeFalsy();
    });
    it('touches every field', () => {
      const form = createForm({});

      expect(form.fields.address.fields?.streetName.isTouched()).toBeFalsy();
      expect(form.fields.address.fields?.streetNumber.isTouched()).toBeFalsy();
      form.fields.address.setTouched(true);
      expect(form.fields.address.fields?.streetName.isTouched()).toBeTruthy();
      expect(form.fields.address.fields?.streetNumber.isTouched()).toBeTruthy();
    });
    it('resets every field', () => {
      const form = createForm({});

      expect(form.fields.address.fields?.streetName.value).toBeFalsy();
      expect(form.fields.address.fields?.streetNumber.value).toBeFalsy();
      form.fields.address.onChange({
        streetName: 'Test Address',
        streetNumber: 23,
      });
      expect(form.fields.address.fields?.streetName.value).toBeTruthy();
      expect(form.fields.address.fields?.streetNumber.value).toBeTruthy();
      form.fields.address.reset();
      expect(form.fields.address.fields?.streetName.value).toBeFalsy();
      expect(form.fields.address.fields?.streetNumber.value).toBeFalsy();
      expect(form.fields.address.fields?.streetName.isTouched()).toBeFalsy();
      expect(form.fields.address.fields?.streetNumber.isTouched()).toBeFalsy();
    });
    it('is valid when all fields are valid', () => {
      const form = createForm({
        value: {
          address: {
            streetName: '',
            streetNumber: 23,
          },
        },
        validations: {
          address: {
            streetName: 'required',
            streetNumber: 'number',
          },
        },
      });
      expect(form.valid).toBeFalsy();
      expect(form.fields.address.valid).toBeFalsy();
      form.fields.address.fields?.streetName.onChange('Test Address');
      expect(form.fields.address.valid).toBeTruthy();
      expect(form.valid).toBeTruthy();
    });
    it('is touched when all fields are touched', () => {
      const form = createForm({});

      expect(form.fields.address.isTouched()).toBeFalsy();
      // Instanciate the fields
      expect(form.fields.address.fields?.streetName.isTouched()).toBeFalsy();
      expect(form.fields.address.fields?.streetNumber.isTouched()).toBeFalsy();
      form.fields.address.fields?.streetName.setTouched(true);
      expect(form.fields.address.isTouched()).toBeFalsy();
      form.fields.address.fields?.streetNumber.setTouched(true);
      expect(form.fields.address.isTouched()).toBeTruthy();
    });
    it('is dirty when some fields are dirty', () => {
      const form = createForm({});
      expect(form.dirty).toBeFalsy();
      expect(form.fields.address.isDirty()).toBeFalsy();
      // Instantiate street Number
      form.fields.address.fields?.streetName.onChange('Test Address');
      expect(form.fields.address.fields?.streetName.isDirty()).toBeTruthy();
      expect(form.fields.address.fields?.streetNumber.isDirty()).toBeFalsy();
      expect(form.fields.address.isDirty()).toBeTruthy();
    });
    it('has value when all fields have value', () => {
      const form = createForm({});
      expect(form.fields.address.hasValue()).toBeFalsy();
      form.fields.address.fields?.streetName.onChange('');
      form.fields.address.fields?.streetNumber.onChange(23);
      expect(form.fields.address.hasValue()).toBeFalsy();
      form.fields.address.fields?.streetName.onChange('Test Address');
      expect(form.fields.address.hasValue()).toBeTruthy();
    });
  });
});
