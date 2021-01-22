import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from '../src/index';

function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    model: {
      name: '',
      emails: [''],
    },
    handleSubmit: async () => {
      // eslint-disable-next-line
      console.log(model);
    },
    validations: {
      name: 'email',
      emails: ['email'],
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      <fieldset>
        <legend>Simple fields</legend>
        <label>Name: </label>
        <input
          onBlur={fields.name.onBlur}
          value={fields.name.value}
          onChange={(v) => fields.name.onChange(v.target.value)}
        />
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
                field.errors.map((error) => <small key={error}>{error}</small>)}
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
      <button>Submit</button>
    </form>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
