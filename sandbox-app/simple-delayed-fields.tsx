import React, { useEffect } from 'react';

import { Input } from './components/Input';
import { useForm } from '../src';

function useMyApiValue(): string {
  const [value, setValue] = React.useState('');
  useEffect(() => {
    setTimeout(() => setValue('John'), 1000);
  }, []);
  return value;
}

export function SimpleDelayedFields(): JSX.Element {
  const name = useMyApiValue();
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
    model: { name },
    onSubmit: async ({ model }) => {
      // eslint-disable-next-line no-console
      console.log(model);
    },
    validations: {
      name: 'required',
    },
  });

  return (
    <>
      <h2 id="simple-delayed-fields">Simple Delayed Fields</h2>
      <form onSubmit={onSubmit}>
        <div className="stack">
          <Input label="Name: " {...fields.name} />
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
