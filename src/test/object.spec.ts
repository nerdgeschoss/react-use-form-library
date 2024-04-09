import { createForm, tracker } from './util';

import { Form } from '../form';

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('nested objects', () => {
    it('updates the value after changing nested fields', () => {
      const form = createForm();
      expect(form.fields.address.value).toEqual(undefined);
      expect(form.fields.address.fields.streetName.value).toEqual(undefined);
      form.fields.address.fields.streetName.onChange('Test Address 123');
      expect(form.fields.address.value.streetName).toEqual('Test Address 123');
    });
    it('mass updates fields', () => {
      const form = createForm();
      form.fields.address.onChange({
        streetName: 'Test Address',
        streetNumber: 23,
      });
      expect(form.fields.address.fields.streetName.value).toEqual(
        'Test Address'
      );
      expect(form.fields.address.fields.streetNumber.value).toEqual(23);
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

      form.validate();
      expect(form.fields.address.fields.streetName.valid).toBeTruthy();
      form.fields.address.fields.streetName.onChange('');
      expect(form.fields.address.fields.streetName.valid).toBeFalsy();
    });
    it('touches every field', () => {
      const form = createForm();

      expect(form.fields.address.fields.streetName.touched).toBeFalsy();
      form.fields.address.touch();
      expect(form.fields.address.fields?.streetName.touched).toBeTruthy();
    });
    it('resets every field', () => {
      const form = createForm({
        value: { address: { streetName: 'original' } },
      });
      form.fields.address.onChange({
        streetName: 'Test Address',
        streetNumber: 23,
      });
      expect(form.fields.address.fields.streetName.value).toEqual(
        'Test Address'
      );
      form.fields.address.touch();
      expect(form.fields.address.fields.streetName.touched).toEqual(true);
      expect(form.fields.address.fields.streetName.dirty).toEqual(true);
      form.fields.address.reset();
      expect(form.fields.address.fields.streetName.dirty).toBeFalsy();
      expect(form.fields.address.fields.streetName.touched).toBeFalsy();
      expect(form.fields.address.fields.streetName.value).toEqual('original');
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
    it('is dirty when some fields are dirty', () => {
      const form = createForm({});
      expect(form.dirty).toBeFalsy();
      expect(form.fields.address.dirty).toBeFalsy();
      // Instantiate street Number
      form.fields.address.fields?.streetName.onChange('Test Address');
      expect(form.fields.address.fields?.streetName.dirty).toBeTruthy();
      expect(form.fields.address.fields?.streetNumber.dirty).toBeFalsy();
      expect(form.fields.address.dirty).toBeTruthy();
    });
  });
});
