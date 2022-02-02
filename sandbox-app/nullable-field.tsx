import React from 'react';
import { useForm } from '../src';
import { Input } from './components/Input';

interface Model {
  avatar?: {
    url: string;
  } | null;
}

const initialValue: Model = {};

export function NullableField(): JSX.Element {
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
      <h2 id="nullable-field">Nullable Field</h2>
      <form onSubmit={onSubmit}>
        {model.avatar !== null ? (
          <>
            <Input {...fields.avatar.fields.url} />
            <button onClick={() => fields.avatar.onChange(null)} type="button">
              remove avatar
            </button>
          </>
        ) : (
          <button onClick={() => fields.avatar.fields.url.onChange('')}>
            add avatar
          </button>
        )}
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
