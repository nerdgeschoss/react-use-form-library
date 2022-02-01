import React from 'react';
import { useForm } from '../src';
import { Input } from './components/Input';

interface Model {
  emails?: string[];
}

const initialValue: Model = {
  emails: ['bye@example.com', 'stay@example.com'],
};

export function SimpleArray(): JSX.Element {
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
      emails: ['email'],
    },
  });

  return (
    <>
      <h2 id="simple-array">Simple Array</h2>
      <form onSubmit={onSubmit}>
        <div className="stack">
          {fields.emails.elements.map((field, index) => {
            return (
              <Input
                label="Email"
                key={index}
                {...field}
                onRemove={() => field.remove()}
              />
            );
          })}
          <div>
            <button type="button" onClick={() => fields.emails.add('')}>
              Add email
            </button>
          </div>
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
