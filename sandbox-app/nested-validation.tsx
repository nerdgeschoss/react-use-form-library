import React from 'react';
import { useForm } from '../src';
import { Input } from './components/Input';

interface Model {
  address?: {
    streetName?: string;
  };
}

const initialValue: Model = {};

export function NestedValidation(): JSX.Element {
  const {
    model,
    changes,
    fields,
    onSubmit,
    valid,
    dirty,
    submissionStatus,
    reset,
  } = useForm({
    model: initialValue,
    onSubmit: async ({ model }) => {
      // eslint-disable-next-line no-console
      console.log(model);
    },
    validations: {
      address: {
        streetName: 'required',
      },
    },
  });

  return (
    <>
      <h2 id="nested-field">Nested Field</h2>
      <form onSubmit={onSubmit}>
        <div className="stack">
          <Input label="Street name: " {...fields.address.fields.streetName} />
          <footer>
            <button>Submit</button>
            <button onClick={reset} type="button">
              Reset
            </button>
          </footer>
        </div>
      </form>
      <h4>Model</h4>
      <pre>
        {JSON.stringify({ model, valid, dirty, submissionStatus }, null, 2)}
      </pre>
      <h4>Changes</h4>
      <pre>{JSON.stringify({ changes }, null, 2)}</pre>
      <a href="#">Back</a>
    </>
  );
}
