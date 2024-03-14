import { createForm, tracker } from './util';

import { Form } from '../form';

describe(Form, () => {
  beforeEach(() => tracker.reset());

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

    it('should have errors if field is required and value nullish', () => {
      const form = createForm({
        value: {
          name: null,
        },
        validations: { name: 'required' },
      });
      expect(form.fields.name.errors).toHaveLength(1);
      expect(form.fields.name.errors[0]).toEqual('required-field');
    });

    it('uses an array of validations', () => {
      const form = createForm({
        validations: { name: ['required', 'number'] },
      });
      expect(form.fields.name.required).toBeTruthy();
      expect(form.fields.name.valid).toBeFalsy();
      expect(form.fields.name.errors.length).toEqual(1);
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('5');
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
        value: { age: 12 },
        validations: {
          age: ({ model }) => (model.age < 18 ? ['too young'] : []),
        },
      });
      expect(form.fields.age.errors).toEqual(['too young']);
      expect(form.fields.age.valid).toBeFalsy();
      form.fields.age.onChange(20);
      expect(form.fields.age.errors).toEqual([]);
      expect(form.fields.age.valid).toBeTruthy();
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

    it('validates arrays with custom functions', () => {
      const form = createForm({
        validations: {
          emails: ({ model }) =>
            (model.emails ?? []).length === 0 ? ['specify at least one'] : [],
        },
      });
      expect(form.fields.emails.errors).toEqual(['specify at least one']);
      expect(form.fields.emails.valid).toEqual(false);
      form.fields.emails.onChange(['hello@example.com']);
      expect(form.fields.emails.valid).toEqual(true);
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
        validations: { json: 'json' },
      });

      // Allow empty value
      form.fields.json.onChange('');
      expect(form.fields.json.errors).toHaveLength(0);
      form.fields.json.onChange(undefined);
      expect(form.fields.json.errors).toHaveLength(0);

      // Fails on string
      // Fails on number
      form.fields.json.onChange(5);
      expect(form.fields.json.errors).toContain('invalid-json');
      // Fails on string number
      form.fields.json.onChange('5');
      expect(form.fields.json.errors).toContain('invalid-json');
      // Fails on boolean
      form.fields.json.onChange(true);
      expect(form.fields.json.errors).toContain('invalid-json');
      // Fails on string boolean
      form.fields.json.onChange('true');
      expect(form.fields.json.errors).toContain('invalid-json');
      // Fails on null
      form.fields.json.onChange(null);
      expect(form.fields.json.errors).toContain('invalid-json');
      // Fails on string null
      form.fields.json.onChange('null');
      expect(form.fields.json.errors).toContain('invalid-json');
      // Fails on array
      form.fields.json.onChange('[]');
      expect(form.fields.json.errors).toContain('invalid-json');

      form.fields.json.onChange('{ "foo": "baz"}');
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
});
