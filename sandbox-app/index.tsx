import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from '../src/index';

function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    model: {
      name: '',
    },
    handleSubmit: async () => {
      // eslint-disable-next-line
      console.log(model);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      <input
        value={fields.name.value}
        onChange={(v) => fields.name.onChange(v.target.value)}
      />
      <button>Submit</button>
    </form>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
