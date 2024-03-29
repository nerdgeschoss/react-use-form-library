import React from 'react';
import { useForm } from '../src';

export function OnChange(): JSX.Element {
  const data = React.useRef({
    name: 'John Doe',
    confirm: false,
  });

  const { fields, changes, touched, onSubmit, reset } = useForm({
    model: data.current,
    onSubmit: async ({ model }) => {
      data.current = model;
    },
    onChange: async ({ changes, touched }) => {
      data.current = {
        ...data.current,
        ...changes,
        ...touched,
      };
    },
  });

  return (
    <>
      <h2 id="on-change">On Change</h2>
      <p>
        Changes does not reflect a double toggled boolean state because the
        value will be the same as the initial value. We can now use the touched
        object to get an updated model with the changes.
      </p>

      <form onSubmit={onSubmit}>
        <label>
          <span>Confirm</span>
          <input
            type="checkbox"
            checked={fields.confirm.value}
            onChange={(event) => {
              fields.confirm.touch();
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
        {JSON.stringify({ data: data.current, changes, touched }, null, 2)}
      </pre>
      <a href="#">Back</a>
    </>
  );
}
