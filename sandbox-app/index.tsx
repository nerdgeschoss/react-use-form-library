import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from '../src/index';
import { Input } from './components/Input';
import { NumberInput } from './components/NumberInput';

interface Model {
  name: string;
  age?: number;
  emails: string[];
  address?: {
    streetName?: string;
    streetNumber?: number;
  };
  images: Array<{
    id: string | number;
    tags?: string[];
    url?: string;
  }>;
  avatar?: {
    url: string;
  } | null;
  simpleObject?: {
    value: string;
    label: string;
  };
}

const initialValue: Model = {
  name: '',
  emails: [],
  images: [
    {
      id: '1',
      url: '',
      tags: ['asd'],
    },
  ],
};

function App(): JSX.Element {
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
      emails: ['email'],
    },
  });

  return (
    <>
      <h2>Form</h2>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Simple fields</legend>
          <Input label="Name: " {...fields.name} />
          <NumberInput label="Age: " {...fields.age} />
        </fieldset>
        <fieldset>
          <legend>Array fields</legend>
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
          <footer>
            <button type="button" onClick={() => fields.emails.add('')}>
              Add email
            </button>
          </footer>
        </fieldset>
        <fieldset>
          <legend>Images</legend>
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

          <footer>
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
          </footer>
        </fieldset>
        <fieldset>
          <legend>Nested Fields</legend>
          <Input label="Street name: " {...fields.address.fields.streetName} />
          <NumberInput
            label="Street number: "
            {...fields.address.fields.streetNumber}
          />
        </fieldset>

        {/* AVATAR */}
        <fieldset>
          <legend>Avatar Url (nullable field)</legend>
          {model.avatar !== null ? (
            <>
              <Input {...fields.avatar.fields.url} />
              <button
                onClick={() => fields.avatar.onChange(null)}
                type="button"
              >
                remove avatar
              </button>
            </>
          ) : (
            <button onClick={() => fields.avatar.fields.url.onChange('')}>
              add avatar
            </button>
          )}
        </fieldset>

        {/* SIMPLE OBJECT FIELD */}
        <fieldset>
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
        </fieldset>

        <button>Submit</button>
        <button onClick={reset} type="button">
          Reset
        </button>
      </form>

      <h2>Model</h2>
      <pre>
        {JSON.stringify({ model, valid, dirty, submissionStatus }, null, 2)}
      </pre>

      <h2>Changes</h2>
      <pre>{JSON.stringify({ changes }, null, 2)}</pre>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
