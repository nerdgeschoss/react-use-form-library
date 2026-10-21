import { Model, createForm, tracker } from './util';

import { Form } from '../form';
import { FormSnapshot, FormViews } from '../views';

function setup(value: Partial<Model> = {}): {
  form: Form<Model>;
  views: FormViews<Model>;
  read: () => FormSnapshot<Model>;
} {
  const form = createForm({
    value,
    validations: { name: 'required' },
  });
  const views = new FormViews<Model>();
  return { form, views, read: () => views.read(form) };
}

describe(FormViews, () => {
  beforeEach(() => tracker.reset());

  describe('identity', () => {
    it('keeps every identity while nothing changes', () => {
      const { read } = setup();
      const first = read();
      const second = read();
      expect(second.fields).toBe(first.fields);
      expect(second.fields.name).toBe(first.fields.name);
      expect(second.model).toBe(first.model);
      expect(second.changes).toBe(first.changes);
      expect(second.fields.name.onChange).toBe(first.fields.name.onChange);
    });

    it('gives a changed field, fields and model a new identity', () => {
      const { read } = setup();
      const before = read();
      const beforeName = before.fields.name;
      beforeName.onChange('Ada');
      const after = read();
      expect(after.fields.name).not.toBe(beforeName);
      expect(after.fields).not.toBe(before.fields);
      expect(after.model).not.toBe(before.model);
      expect(after.changes).not.toBe(before.changes);
    });

    it('keeps the identity of unchanged sibling fields', () => {
      const { read } = setup();
      const before = read();
      before.fields.name.onChange('Ada');
      expect(read().fields.age).toBe(before.fields.age);
    });

    it('changes identity on touch, focus, reset and updateFields', () => {
      const { form, read } = setup({ name: 'Ada' });
      const actions = [
        () => read().fields.name.touch(),
        () => read().fields.name.onFocus(),
        () => read().fields.name.onBlur(),
        () => form.updateFields({ name: 'Grace' }),
        () => read().fields.name.reset(),
      ];
      for (const action of actions) {
        const before = read().fields.name;
        action();
        expect(read().fields.name).not.toBe(before);
      }
    });

    it('changes identity when validation errors change', () => {
      const { read } = setup({ name: 'Ada' });
      const before = read().fields.name;
      expect(before.valid).toBe(true);
      before.onChange('');
      const after = read().fields.name;
      expect(after).not.toBe(before);
      expect(after.errors).toEqual(['required-field']);
    });
  });

  describe('live reads and writes', () => {
    it('reads the new value right after a write', () => {
      const { read } = setup();
      const { fields, model } = read();
      fields.name.onChange('Ada');
      expect(fields.name.value).toBe('Ada');
      expect(model.name).toBe('Ada');
    });

    it('writes to the live model', () => {
      const { form, read } = setup();
      read().model.description = 'written directly';
      expect(form.model.description).toBe('written directly');
    });

    it('spreads to the same props as the live field', () => {
      const { form, read } = setup({ name: 'Ada' });
      const view = { ...read().fields.name };
      const live = { ...form.fields.name };
      expect(Object.keys(view)).toEqual(Object.keys(live));
      expect(view.value).toBe(live.value);
      expect(view.valid).toBe(live.valid);
    });

    it('returns a field created after the last read', () => {
      const { read } = setup();
      const { fields } = read();
      expect(fields.json.value).toBeUndefined();
      fields.json.onChange({ a: 1 });
      expect(read().fields.json.value).toEqual({ a: 1 });
    });

    it('keeps the side effect of reading fields on a leaf field', () => {
      const { form, read } = setup();
      const { fields } = read();
      void (fields.confirmed as unknown as { fields: unknown }).fields;
      expect(form.fields.confirmed.value).toEqual({});
    });
  });

  describe('nested values', () => {
    it('gives the parent and model a new identity when a nested field changes', () => {
      const { read } = setup({ address: { streetName: 'Main' } });
      const before = read();
      const beforeAddressField = before.fields.address;
      const beforeAddress = before.model.address;
      beforeAddressField.fields.streetName.onChange('Side');
      const after = read();
      expect(after.fields.address).not.toBe(beforeAddressField);
      expect(after.model.address).not.toBe(beforeAddress);
      expect(after.model.address?.streetName).toBe('Side');
    });

    it('updates field sets on add and remove', () => {
      const { read } = setup({ hobbies: [{ name: 'chess' }] });
      const beforeHobbies = read().fields.hobbies;
      beforeHobbies.add({ name: 'go' });
      const added = read();
      expect(added.fields.hobbies).not.toBe(beforeHobbies);
      expect(added.fields.hobbies.elements.length).toBe(2);
      expect(added.model.hobbies.map((hobby) => hobby.name)).toEqual([
        'chess',
        'go',
      ]);
      added.fields.hobbies.elements[0].remove();
      const removed = read();
      expect(removed.fields.hobbies.elements.length).toBe(1);
      expect(removed.model.hobbies[0].name).toBe('go');
    });

    it('returns frozen nested values unchanged', () => {
      const address = Object.freeze({ streetName: 'Main' });
      const { read } = setup({ address });
      expect(read().model.address?.streetName).toBe('Main');
    });
  });

  describe('methods', () => {
    it('returns the same functions on every read', () => {
      const { form, views } = setup();
      expect(views.methods(form)).toBe(views.methods(form));
    });
  });
});
