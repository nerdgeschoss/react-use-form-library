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
  }>({
    model: {
      name: '',
      emails: [],
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
          {fields.name.touched &&
            fields.name.errors.map((error) => (
              <small key={error}>* {error}</small>
            ))}
        </fieldset>
        <fieldset>
          <legend>Array fields</legend>
          {fields.emails.map((field, index) => {
            return (
              <div key={index}>
                <div>
                  <label>Email: </label>
                  <input
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={(v) => field.onChange(v.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => fields.emails.removeField(index)}
                  >
                    x
                  </button>
                </div>
                {field.touched &&
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
                fields.emails.addFields({
                  value: '',
                  validation: 'email',
                })
              }
            >
              Add email
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
            {fields.address.fields.streetName.touched &&
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
            {fields.address.fields.streetNumber.touched &&
              fields.address.fields.streetNumber.errors.map((error) => (
                <small key={error}>* {error}</small>
              ))}
          </div>
        </fieldset>
        <button disabled={!canSubmit}>Submit</button>
      </form>
      <pre>{JSON.stringify({ model, valid, dirty }, null, 2)}</pre>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
