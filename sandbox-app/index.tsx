import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from '../src/index';
import { Input } from './components/Input';
import { NumberInput } from './components/NumberInput';

function App(): JSX.Element {
  const {
    model,
    changes,
    fields,
    onSubmit,
    canSubmit,
    valid,
    dirty,
  } = useForm<{
    name: string;
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
  }>({
    model: {
      name: '',
      emails: [],
      images: [
        {
          id: '1',
          url: '',
          tags: ['asd'],
        },
      ],
    },
    handleSubmit: async () => {
      // eslint-disable-next-line
      console.log(model);
    },
    validations: {
      name: 'required',
      emails: ['email'],
    },
  });

  return (
    <>
      <h2>Form</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
      >
        <fieldset>
          <legend>Simple fields</legend>
          <Input label="Name: " {...fields.name} />
        </fieldset>
        <fieldset>
          <legend>Array fields</legend>
          {fields.emails.fields.map((field, index) => {
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
            <button type="button" onClick={() => fields.emails.insert('')}>
              Add email
            </button>
          </footer>
        </fieldset>
        <fieldset>
          <legend>Images</legend>
          {fields.images.fields.map((field, index) => {
            return (
              <fieldset key={index}>
                <legend>Image:</legend>
                <div>
                  <Input label="Image URL: " {...field.fields.url} />
                  {field.fields.tags.fields.map((field2, index) => {
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
                    onClick={() => field.fields.tags.insert('')}
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
                fields.images.insert({
                  id: fields.images.fields.length,
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
        <button disabled={!canSubmit}>Submit</button>
      </form>

      <h2>Model</h2>
      <pre>{JSON.stringify({ model, valid, dirty }, null, 2)}</pre>

      <h2>Changes</h2>
      <pre>{JSON.stringify({ changes }, null, 2)}</pre>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
