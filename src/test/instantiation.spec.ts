import { Model, createForm, tracker } from './util';

import { Form } from '../form';

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('instantiation', () => {
    let form = null as unknown as Form<Model>;
    beforeEach(() => (form = createForm()));
    it('creates an empty field name', () => {
      expect(form.fields.name).toBeTruthy();
      expect(form.fields.name.value).toEqual('');
      expect(form.fields.name.dirty).toBeFalsy();
    });
    it('creates an pre filled field age', () => {
      expect(form.fields.age).toBeTruthy();
      expect(form.fields.age.value).toBeTruthy();
      expect(form.fields.age.dirty).toBeFalsy();
    });
    it('can be destructured', () => {
      const { value, valid, onChange, onBlur, onFocus } = form.fields.age;
      expect(value).toEqual(18);
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
    it('creates optional content by accessing it', () => {
      const form = createForm();
      expect(form.model.optionalContent).toBeUndefined();
      expect(form.fields.optionalContent.fields.name.value).toBeUndefined();
      expect(form.model.optionalContent).not.toBeUndefined();
    });
    it('calls onInit function and updates changes object', () => {
      const form = createForm({
        onInit: (form) => form.fields.name.onChange('Test'),
      });
      expect(form.changes.name).toBe('Test');
    });
  });
});
