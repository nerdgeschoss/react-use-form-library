import React from 'react';
import { useForm } from '../src';
import { Input } from './components/Input';

interface Model {
  simpleObject?: {
    value: string;
    label: string;
  };
}

const initialValue: Model = {};

export function SimpleObject(): JSX.Element {
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
  });

  return (
    <>
      <h2 id="simple-object">Simple Object</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={fields.simpleObject.value?.label}
          onChange={(event) =>
            fields.simpleObject.onChange({
              label: event.target.value,
              value: event.target.value,
            })
          }
        />
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
