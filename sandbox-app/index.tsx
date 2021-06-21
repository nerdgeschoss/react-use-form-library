import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from '../src/index';

function App(): JSX.Element {
  const { model, fields, onSubmit, canSubmit, valid, dirty } = useForm<{
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
          tags: [],
          url: 'string',
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

  // fields.images.fields[0].fields.tags.insert('asd');

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
          <div>
            <label>Name: </label>
            <input
              onBlur={fields.name.onBlur}
              value={fields.name.value}
              onChange={(v) => fields.name.onChange(v.target.value)}
            />
          </div>
          {fields.name.isTouched() &&
            fields.name.errors.map((error) => (
              <small key={error}>* {error}</small>
            ))}
        </fieldset>
        <fieldset>
          <legend>Array fields</legend>
          {fields.emails.fields.map((field, index) => {
            return (
              <div key={index}>
                <div>
                  <label>Email: </label>
                  <input
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={(v) => field.onChange(v.target.value)}
                  />
                  <button type="button" onClick={() => field.remove()}>
                    x
                  </button>
                </div>
                {field.isTouched() &&
                  field.errors.map((error) => (
                    <small key={error}>* {error}</small>
                  ))}
              </div>
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
              <div key={index}>
                <div>
                  <label>Image URL: </label>
                  <input
                    onBlur={field.onBlur}
                    value={field.fields.url.value}
                    onChange={(v) => field.fields.url.onChange(v.target.value)}
                  />
                  <fieldset>
                    <legend>Array fields</legend>
                    {field.fields.tags.fields.map((field2, index) => {
                      return (
                        <div key={index}>
                          <div>
                            <label>Email: </label>
                            <input
                              onBlur={field2.onBlur}
                              value={field2.value}
                              onChange={(v) => field2.onChange(v.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => field2.remove()}
                            >
                              x
                            </button>
                          </div>
                          {field.isTouched() &&
                            field.errors.map((error) => (
                              <small key={error}>* {error}</small>
                            ))}
                        </div>
                      );
                    })}

                    <footer>
                      <button
                        type="button"
                        onClick={() => field.fields.tags.insert('')}
                      >
                        Add email
                      </button>
                    </footer>
                  </fieldset>
                  <button type="button" onClick={() => field.remove()}>
                    x
                  </button>
                </div>
                {field.isTouched() &&
                  field.errors.map((error) => (
                    <small key={error}>* {error}</small>
                  ))}
              </div>
            );
          })}

          <footer>
            <button
              type="button"
              onClick={() =>
                fields.images.insert({
                  id: fields.images.fields.length,
                })
              }
            >
              Add image
            </button>
          </footer>
        </fieldset>
        <fieldset>
          <legend>Nested Fields</legend>
          <div>
            <div>
              <label>Street name: </label>
              <input
                onBlur={fields.address.fields.streetName.onBlur}
                value={fields.address.fields.streetName.value}
                onChange={(v) =>
                  fields.address.fields.streetName.onChange(v.target.value)
                }
              />
            </div>
            {fields.address.fields.streetName.isTouched() &&
              fields.address.fields.streetName.errors.map((error) => (
                <small key={error}>* {error}</small>
              ))}
          </div>
          <div>
            <div>
              <label>Street number: </label>
              <input
                onBlur={fields.address.fields.streetNumber.onBlur}
                value={fields.address.fields.streetNumber.value}
                onChange={(v) =>
                  fields.address.fields.streetNumber.onChange(
                    v.target.value === '' ? undefined : Number(v.target.value)
                  )
                }
              />
            </div>
            {fields.address.fields.streetNumber.isTouched() &&
              fields.address.fields.streetNumber.errors.map((error) => (
                <small key={error}>* {error}</small>
              ))}
          </div>
        </fieldset>

        {/* AVATAR */}
        <fieldset>
          <legend>Avatar Url (nullable field)</legend>
          <input
            value={fields.avatar.fields.url.value}
            onChange={(e) => fields.avatar.fields.url.onChange(e.target.value)}
          />
          <button onClick={() => fields.avatar.onChange(null)} type="button">
            remove avatar
          </button>
        </fieldset>
        <button disabled={!canSubmit}>Submit</button>
      </form>

      <h2>Model</h2>
      <pre>{JSON.stringify({ model, valid, dirty }, null, 2)}</pre>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
