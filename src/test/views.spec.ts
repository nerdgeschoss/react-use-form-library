import { types } from 'util';

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

  describe('reads and writes in the same handler', () => {
    function rendered(value: Partial<Model>): ReturnType<typeof setup> & {
      snapshot: FormSnapshot<Model>;
    } {
      const result = setup(value);
      const snapshot = result.read();
      void snapshot.model.address?.streetName;
      void snapshot.fields.address.value;
      void snapshot.fields.hobbies.value;
      void snapshot.fields.hobbies.elements;
      return { ...result, snapshot };
    }

    it('reads a nested value replaced by onChange', () => {
      const { snapshot } = rendered({ address: { streetName: 'Main' } });
      const { fields, model } = snapshot;
      fields.address.onChange({ streetName: 'Side' });
      expect(fields.address.value?.streetName).toBe('Side');
      expect(model.address?.streetName).toBe('Side');
    });

    it('reads elements and value after add', () => {
      const { snapshot } = rendered({ hobbies: [{ name: 'chess' }] });
      const { fields, model } = snapshot;
      fields.hobbies.add({ name: 'go' });
      expect(fields.hobbies.elements.length).toBe(2);
      expect(fields.hobbies.value.length).toBe(2);
      expect(model.hobbies.length).toBe(2);
    });

    it('reads an array replaced by onChange', () => {
      const { snapshot } = rendered({ hobbies: [{ name: 'chess' }] });
      const { fields } = snapshot;
      fields.hobbies.onChange([{ name: 'a' }, { name: 'b' }]);
      expect(fields.hobbies.value.map((hobby) => hobby.name)).toEqual([
        'a',
        'b',
      ]);
    });

    it('changes the added element, not another one', () => {
      const { form, snapshot } = rendered({ hobbies: [{ name: 'chess' }] });
      const { fields } = snapshot;
      fields.hobbies.add({ name: 'go' });
      const elements = fields.hobbies.elements;
      elements[elements.length - 1].onChange({ name: 'changed' });
      expect(form.model.hobbies.map((hobby) => hobby.name)).toEqual([
        'chess',
        'changed',
      ]);
      expect(Object.keys(form.model.hobbies)).toEqual(['0', '1']);
    });
  });

  describe('wrappers passed back to the form', () => {
    it('stores the real object on onChange', () => {
      const { form, read } = setup({ address: { streetName: 'Main' } });
      const { fields } = read();
      fields.json.onChange(fields.address.value);
      expect(types.isProxy(form.model.json)).toBe(false);
      expect(form.model.json).toEqual({ streetName: 'Main' });
    });

    it('stores the real object when nested in a plain object', () => {
      const { form, read } = setup({ address: { streetName: 'Main' } });
      const { fields } = read();
      fields.json.onChange({ inner: fields.address.value });
      const json = form.model.json as { inner: unknown };
      expect(types.isProxy(json.inner)).toBe(false);
    });

    it('stores the real object on updateFields', () => {
      const { form, views, read } = setup({ address: { streetName: 'Main' } });
      const { fields } = read();
      views.methods(form).updateFields({ json: fields.address.value });
      expect(types.isProxy(form.model.json)).toBe(false);
    });

    it('stores the real object when assigned through the model', () => {
      const { form, read } = setup({ address: { streetName: 'Main' } });
      const { fields, model } = read();
      model.json = fields.address.value;
      expect(types.isProxy(form.model.json)).toBe(false);
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

  describe('review findings', () => {
    it('returns inherited keys of fields without wrapping them', () => {
      const { read } = setup();
      const { fields } = read();
      expect(() => fields.constructor).not.toThrow();
      expect(Object.prototype.hasOwnProperty.call(fields, 'name')).toBe(true);
      expect(fields.hasOwnProperty('name')).toBe(true);
    });

    it('reads sparse arrays', () => {
      const { read } = setup({ emails: new Array(2) });
      expect(() => read()).not.toThrow();
    });

    it('reads validations that return something other than an array', () => {
      const form = createForm({
        value: { name: 'x' },
        validations: {
          name: (({ value }: { value: string }) =>
            value === 'x' && ['bad']) as never,
        },
      });
      const views = new FormViews<Model>();
      expect(() => views.read(form)).not.toThrow();
      views.read(form).fields.name.onChange('y');
      expect(() => views.read(form)).not.toThrow();
    });

    it('changes identity when an error entry changes, not only the joined text', () => {
      const form = createForm({
        value: { name: 'a' },
        validations: {
          name: ({ model }) => (model.name === 'a' ? ['x\u0000y'] : ['x', 'y']),
        },
      });
      const views = new FormViews<Model>();
      const before = views.read(form).fields.name;
      before.onChange('b');
      expect(views.read(form).fields.name).not.toBe(before);
    });

    it('keeps elements live after add and remove in the same handler', () => {
      const { form, read } = setup({
        hobbies: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      });
      const elements = read().fields.hobbies.elements;
      read().fields.hobbies.add({ name: 'd' });
      expect(elements.length).toBe(4);
      [...elements].forEach((element) => element.remove());
      expect(form.model.hobbies).toEqual([]);
    });

    it('unwraps wrappers of another form', () => {
      const a = setup({ address: { streetName: 'Main' } });
      const b = setup();
      b.read().fields.json.onChange(a.read().fields.address.value);
      expect(types.isProxy(b.form.model.json)).toBe(false);
    });

    it('unwraps writes into nested objects that no field holds yet', () => {
      const { form, read } = setup({
        hobbies: [{ name: 'a' }],
        address: { streetName: 'Main' },
      });
      const { model, fields } = read();
      model.hobbies.push(fields.address.value as { name: string });
      expect(types.isProxy(form.model.hobbies[1])).toBe(false);
    });

    it('writes through Object.create to the child object, as on a plain object', () => {
      const { form, read } = setup({ name: 'a' });
      const child = Object.create(read().model);
      child.name = 'b';
      expect(form.model.name).toBe('a');
      expect(child.name).toBe('b');
    });

    it('gives changes and touchedValues new identities when a nested value changes', () => {
      const { read } = setup({ address: { streetName: 'A' } });
      read().fields.address.fields.streetName.onChange('B');
      read().fields.address.touch();
      const before = read();
      read().fields.address.fields.streetName.onChange('C');
      const after = read();
      expect(after.changes.address).not.toBe(before.changes.address);
      expect(after.touchedValues.address).not.toBe(
        before.touchedValues.address
      );
      expect(after.changes.address?.streetName).toBe('C');
    });

    it('throws when changes or touchedValues are modified', () => {
      const { read } = setup({ name: 'a' });
      read().fields.name.onChange('b');
      read().fields.name.touch();
      const { changes, touchedValues } = read();
      expect(() => {
        (changes as Record<string, unknown>).extra = 1;
      }).toThrow(TypeError);
      expect(() => {
        (touchedValues as Record<string, unknown>).extra = 1;
      }).toThrow(TypeError);
      expect(read().changes).toEqual({ name: 'b' });
    });

    it('keeps the model identity on focus and blur', () => {
      const { read } = setup({ name: 'a' });
      const before = read().model;
      read().fields.name.onFocus();
      read().fields.name.onBlur();
      expect(read().model).toBe(before);
    });

    it('handles large field sets', () => {
      const hobbies = Array.from({ length: 100000 }, (_, i) => ({
        name: String(i),
      }));
      const { read } = setup({ hobbies });
      expect(() => read()).not.toThrow();
    });
  });

  describe('methods', () => {
    it('returns the same functions on every read', () => {
      const { form, views } = setup();
      expect(views.methods(form)).toBe(views.methods(form));
    });
  });
});
