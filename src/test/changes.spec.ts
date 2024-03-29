import { Model, createForm, tracker } from './util';

import { Form } from '../form';

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('tracking changes', () => {
    let form = null as unknown as Form<Model>;
    beforeEach(() => (form = createForm()));

    it('returns the updated model', () => {
      expect(form.changes).toEqual({});
      form.fields.name.onChange('test');
      expect(Object.keys(form.changes).includes('name')).toBeTruthy();
      expect(form.model.name).toBe('test');
    });

    it('is dirty only when there are changes', () => {
      expect(form.dirty).toBeFalsy();
      form.fields.name.onChange('test');
      expect(form.dirty).toBeTruthy();
    });

    it('invokes the callback when a value changes', () => {
      expect(form.fields.name.dirty).toBeFalsy();
      expect(form.fields.name.touched).toBeFalsy();
      form.fields.name.onChange('Freddy');
      expect(form.fields.name.dirty).toBeTruthy();
      expect(tracker.wasCalled).toBeTruthy();
    });

    it('invokes the callback for undefined values', () => {
      expect(form.fields.description).toBeDefined();
      expect(form.fields.description.value).toBeUndefined();
      expect(tracker.wasCalled).toBeFalsy();
      form.fields.description.onChange('Test description');
      expect(tracker.wasCalled).toBeTruthy();
    });

    it('mass assigns', () => {
      form.updateFields({ name: 'George', age: 5 });
      expect(form.changes).toEqual({ name: 'George', age: 5 });
    });

    it("doesn't track same value as a change", () => {
      form.fields.age.onChange(18);
      expect(form.fields.name.dirty).toBeFalsy();
      expect(form.changes).toEqual({});
    });

    it('updates nested objects', () => {
      form.fields.address.onChange({ streetName: 'Street', streetNumber: 12 });
      expect(form.fields.address.value).toEqual({
        streetName: 'Street',
        streetNumber: 12,
      });
    });

    it('updates array values', () => {
      form.fields.emails.onChange(['hello@example.com']);
      expect(form.fields.emails.value).toEqual(['hello@example.com']);
    });

    it('touches fields on blur', () => {
      expect(form.fields.name.touched).toEqual(false);
      form.fields.name.onFocus();
      expect(form.fields.name.touched).toEqual(false);
      form.fields.name.onBlur();
      expect(form.fields.name.touched).toEqual(true);
    });
  });

  describe('change handler', () => {
    it('invokes the onChange callback when a field changes value', () => {
      const initializeAppSpy = jest.fn();
      const form = createForm({
        onChange: initializeAppSpy,
      });
      form.fields.name.onChange('Freddy');
      form.fields.age.onChange(27);
      expect(initializeAppSpy).toHaveBeenCalledTimes(2);
    });

    it('passes the form values on the onChange method', () => {
      let storedFormValues = null;
      const form = createForm({
        onChange: (form) => {
          storedFormValues = form;
        },
      });
      form.fields.name.onChange('George');
      form.fields.age.onChange(30);
      expect(storedFormValues).toEqual(form);
    });
  });

  it('touched object contains the changed field', () => {
    const form = createForm({
      value: { confirmed: false },
    });

    form.fields.confirmed.onChange(true);
    expect(form.changes.confirmed).toEqual(true);

    form.fields.confirmed.onChange(false);
    form.fields.confirmed.onBlur();
    expect(form.changes.confirmed).toEqual(undefined);
    expect(form.touched.confirmed).toEqual(false);
  });
});
