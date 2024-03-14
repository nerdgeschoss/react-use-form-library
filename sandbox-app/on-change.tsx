import React from 'react';
import { useForm } from '../src';

export function OnChange(): JSX.Element {
  const data = React.useRef({});
  const updatedChanges = React.useRef({});

  const { fields, model, onSubmit, reset } = useForm({
    model: {
      name: 'John Doe',
      confirm: false,
    },
    onSubmit: async ({ model }) => {
      data.current = model;
    },
    updateModelOnChange: true,
    onChange: async ({ changes }) => {
      updatedChanges.current = changes;
      data.current = {
        ...data.current,
        ...changes,
      };
    },
  });

  return (
    <>
      <h2 id="on-change">On Change</h2>
      <form onSubmit={onSubmit}>
        <label>
          <span>Confirm</span>
          <input
            type="checkbox"
            checked={fields.confirm.value}
            onChange={(event) => {
              fields.confirm.onChange(event.target.checked);
            }}
          />
        </label>
        <footer>
          <button>Submit</button>
          <button onClick={reset} type="button">
            Reset
          </button>
        </footer>
      </form>
      <h4>Data</h4>
      <pre>
        {JSON.stringify(
          { data: data.current, model, changes: updatedChanges.current },
          null,
          2
        )}
      </pre>
      <a href="#">Back</a>
    </>
  );
}
