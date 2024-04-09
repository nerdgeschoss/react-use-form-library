import { createForm, tracker } from './util';

import { Form } from '../form';

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('submitting', () => {
    it('prevents the event default', () => {
      const mock = jest.fn();
      const submitEvent = {
        preventDefault: mock,
      } as unknown as Event;
      const form = createForm();
      form.submit(submitEvent);
      expect(mock).toBeCalled();
    });

    it('invokes the submit handler if all fields are valid', () => {
      const form = createForm();
      expect(tracker.submitted).toBeFalsy();
      form.submit();
      expect(tracker.submitted).toBeTruthy();
    });

    it('does not submit if the fields are not valid', () => {
      const form = createForm({ validations: { name: 'required' } });
      form.submit();
      expect(tracker.submitted).toBeFalsy();
    });

    it('touches fields', () => {
      const form = createForm();
      expect(form.fields.name.touched).toBeFalsy();
      form.submit();
      expect(form.fields.name.touched).toBeTruthy();
    });

    it('can submit with null value', async () => {
      const form2 = createForm({
        value: {
          nullableValue: null,
        },
      });
      expect(form2.fields.nullableValue.value).toBeNull();
      await form2.submit();
    });

    it('can submit after updating to null value', async () => {
      const form2 = createForm({
        value: {
          nullableValue: { id: '1' },
        },
      });
      form2.fields.nullableValue.onChange(null);
      expect(form2.fields.nullableValue.value).toBeNull();
      await form2.submit();
    });

    it('handles async functions', async () => {
      const form = createForm({
        onSubmit: async (form) => {
          expect(form.submissionStatus).toBe('submitting');
        },
      });
      expect(form.submissionStatus).toBe('idle');
      await form.submit();
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
      await form.submit();
      expect(form.submissionStatus).toBe('error');
      expect(form.error).toBeTruthy();
      // Custom error handling
      expect(error).toBeTruthy();
    });
  });

  describe('reseting', () => {
    it('resets fields', () => {
      const form = createForm({
        value: {
          emails: ['bye@example.com', 'stay@example.com'],
        },
      });
      form.fields.name.onChange('hello');
      form.fields.emails.onChange(['hello@example.com', 'stay@example.com']);
      form.reset();
      expect(form.changes).toEqual({});
      expect(form.fields.name.value).toEqual('');
      expect(form.fields.emails.value).toEqual([
        'bye@example.com',
        'stay@example.com',
      ]);
    });

    it('resets items added to an array', () => {
      const form = createForm({
        value: {
          emails: ['bye@example.com', 'stay@example.com'],
        },
      });
      form.fields.emails.onChange([
        'bye@example.com',
        'stay@example.com',
        'hello@example.com',
      ]);
      form.reset();
      expect(form.changes).toEqual({});
      expect(form.fields.emails.value).toEqual([
        'bye@example.com',
        'stay@example.com',
      ]);
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
      await form.submit();
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
      await form.submit();
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
      await form.submit();
      expect(form.submissionStatus).toBe('error');
      form.fields.name.onChange('test');
      expect(form.submissionStatus).toEqual('idle');
    });

    it('allows updating the underlying model', async () => {
      const form = createForm({ value: { name: undefined } });
      expect(form.model.name).toBeUndefined();
      expect(form.fields.name.value).toBeUndefined();
      expect(form.dirty).toEqual(false);
      form.updateOriginalModel({ name: 'Jorge' });
      expect(form.model.name).toEqual('Jorge');
      expect(form.dirty).toEqual(false);
      expect(form.fields.name.dirty).toEqual(false);
      expect(form.fields.name.touched).toEqual(false);
      expect(form.fields.name.value).toEqual('Jorge');
    });

    it('allows updating the underlying model even with null values', async () => {
      const form = createForm({ value: { name: undefined } });
      form.updateOriginalModel({ name: null }); // null counts as an object, check that it doesn't break
      expect(form.model.name).toBeNull();
    });

    it('allows updating the underlying model with object types', async () => {
      const dateValue = new Date();
      const newDateValue = new Date('1969-07-20T20:17:40Z');
      const form = createForm({ value: { dateValue } });
      expect(form.fields.dateValue.value).toEqual(dateValue);
      expect(form.fields.dateValue.dirty).toBeFalsy();
      form.updateOriginalModel({ dateValue: newDateValue });
      expect(form.dirty).toEqual(false);
      expect(form.model.dateValue).toEqual(newDateValue);
      form.fields.dateValue.onChange(dateValue);
      expect(form.fields.dateValue.dirty).toBeTruthy();
      expect(form.dirty).toBeTruthy();
      expect(form.changes['dateValue']).toEqual(dateValue);
    });

    it('does not change the dirty status when changing the underlying model', async () => {
      const form = createForm({ value: { name: 'Klaus' } });
      form.fields.name.onChange('Claudia');
      expect(form.fields.name.dirty).toEqual(true);
      form.updateOriginalModel({ name: 'Jorge' });
      expect(form.fields.name.dirty).toEqual(true);
      expect(form.fields.name.value).toEqual('Claudia');
      expect(form.model.name).toEqual('Claudia');
    });
  });
});
