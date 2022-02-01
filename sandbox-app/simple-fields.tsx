import React from 'react';
import { useForm } from '../src';
import { Input } from './components/Input';
import { NumberInput } from './components/NumberInput';

interface Model {
  name: string;
  age?: number;
}

const initialValue: Model = {
  name: '',
};

export function SimpleFields(): JSX.Element {
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
      name: 'required',
      age: ['required', 'number'],
    },
  });

  return (
    <>
      <h2 id="simple-fields">Simple Fields</h2>
      <form onSubmit={onSubmit}>
        <div className="stack">
          <Input label="Name: " {...fields.name} />
          <NumberInput label="Age: " {...fields.age} />
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
