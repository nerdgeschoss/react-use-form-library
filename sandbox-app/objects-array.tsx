import React from 'react';
import { useForm } from '../src';
import { Input } from './components/Input';

interface Model {
  images?: Array<{
    id: string | number;
    tags?: string[];
    url?: string;
  }>;
}

const initialValue: Model = {
  images: [
    {
      id: '1',
      url: '',
      tags: ['asd'],
    },
  ],
};

export function ObjectsArray(): JSX.Element {
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
      <h2 id="objects-array">Objects Array</h2>
      <form onSubmit={onSubmit}>
        <div className="stack">
          {fields.images.elements.map((field, index) => {
            return (
              <fieldset key={index}>
                <legend>Image:</legend>
                <div>
                  <Input label="Image URL: " {...field.fields.url} />
                  {field.fields.tags.elements.map((field2, index) => {
                    return (
                      <Input
                        key={index}
                        label="Tag: "
                        {...field2}
                        onRemove={() => field2.remove()}
                      />
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => field.fields.tags.add('')}
                  >
                    Add Tag
                  </button>
                  <footer>
                    <button type="button" onClick={() => field.remove()}>
                      x
                    </button>
                  </footer>
                </div>
              </fieldset>
            );
          })}
          <div>
            <button
              type="button"
              onClick={() =>
                fields.images.add({
                  id: fields.images.elements.length,
                  tags: ['one', 'two'],
                })
              }
            >
              Add image
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
