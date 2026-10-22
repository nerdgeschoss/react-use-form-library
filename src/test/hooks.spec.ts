/**
 * @jest-environment jsdom
 */
import { types } from 'util';
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

import { Form } from '../form';
import { FormModel, useForm } from '../hooks';

interface Address {
  street: string;
}

interface TestModel {
  name: string;
  address: Address;
  copy?: Address | null;
}

function renderForm(
  memoize: boolean,
  model: TestModel = { name: 'a', address: { street: 'Main' } },
  onSubmit?: (form: Form<TestModel>) => void
): { current: () => FormModel<TestModel>; rerender: () => void } {
  let latest: FormModel<TestModel> | undefined;
  let forceRender: (() => void) | undefined;
  function Component(): null {
    const [, setCount] = React.useState(0);
    forceRender = () => setCount((count) => count + 1);
    latest = useForm({ model, memoize, onSubmit });
    return null;
  }
  act(() => {
    ReactDOM.render(
      React.createElement(Component),
      document.createElement('div')
    );
  });
  return {
    current: () => latest as FormModel<TestModel>,
    rerender: () => act(() => forceRender?.()),
  };
}

describe(useForm, () => {
  describe('without memoize', () => {
    it('returns the live objects, as before', () => {
      const form = renderForm(false);
      const { fields, model } = form.current();
      act(() => fields.name.onChange('b'));
      expect(form.current().model).toBe(model);
      expect(form.current().fields.name).toBe(fields.name);
      expect(types.isProxy(model)).toBe(false);
    });
  });

  describe('with memoize', () => {
    it('gives a changed field and the model a new identity', () => {
      const form = renderForm(true);
      const { fields, model } = form.current();
      const { name, address } = fields;
      act(() => name.onChange('b'));
      expect(form.current().model).not.toBe(model);
      expect(form.current().fields.name).not.toBe(name);
      expect(form.current().fields.address).toBe(address);
    });

    it('keeps identities across renders without changes', () => {
      const form = renderForm(true);
      const before = form.current();
      form.rerender();
      const after = form.current();
      expect(after.model).toBe(before.model);
      expect(after.fields).toBe(before.fields);
      expect(after.updateFields).toBe(before.updateFields);
      expect(after.fields.name.onChange).toBe(before.fields.name.onChange);
    });

    it("stores real objects when initialised from another form's model", async () => {
      const parent = renderForm(true);
      const live: { model?: TestModel } = {};
      const child = renderForm(
        true,
        { name: 'c', address: parent.current().model.address },
        (form) => {
          live.model = form.model;
        }
      );
      act(() =>
        child.current().fields.copy.onChange(parent.current().model.address)
      );
      await act(async () => {
        await child.current().onSubmit();
      });
      expect(live.model?.copy?.street).toBe('Main');
      expect(types.isProxy(live.model?.address)).toBe(false);
      expect(types.isProxy(live.model?.copy)).toBe(false);
    });
  });
});
