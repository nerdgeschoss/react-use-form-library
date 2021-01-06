# React Use Form Library

![Tests](https://github.com/nerdgeschoss/react-use-form-library/workflows/Tests/badge.svg)

A simple form libray for React using hooks

## Table of Contents

1. [Instalation](#installation)
2. [Basic Example](#basic-example)
3. [Optional fields](#optional-fields)
4. [Validation](#validation)
5. [Advanced Example](#advanced-example)
6. [API](#api)
7. [Development](#development)

## Installation

Add the library to your project: `yarn add react-use-form-library`

## Basic example

[Codepen](https://codepen.io/falkonpunch/pen/oNzyvQG)

To initialize the hook you will need to suply a valid `model` object and a custom `handleSubmit` function.

The three main fields you get from the hook are `{ model, fields, onSubmit }`.

- `model` is the updated object which will contain the modified fields.
- `fields` is an object in which each key will be generated from properties of the original model you supplied to the hook.
- `onSubmit` is the handler you can provide to the `<form>` element. It will call `preventDefault` internally and execute the function provided to the hook as `handleSubmit`

```ts
import { useForm } from 'react-use-form-library';

function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    model: {
      name: '',
    },
    handleSubmit: async () => {
      console.log(model);
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        value={fields.name.value}
        onChange={(v) => fields.name.onChange(v.target.value)}
      />
      <button>Submit</button>
    </form>
  );
}
```

---

## Optional Fields

You don't need to explicitly enumerate all properties in your model, the library will generate all necesary fields on the fly using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

```ts
import { useForm } from 'react-use-form-library';

function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    // You can supply an empty object
    model: {},
    handleSubmit: async () => {
      console.log(model);
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        value={fields.name.value}
        onChange={(v) => fields.name.onChange(v.target.value)}
      />
      <input
        value={fields.phone.value}
        onChange={(v) => fields.phone.onChange(v.target.value)}
      />
      <button>Submit</button>
    </form>
  );
}
```

If you use Typescript you will have to supply the interface for your model

```ts
const { model, fields, onSubmit } = useForm<{ name: string; phone: number }>({
  model: {},
  handleSubmit: async () => {
    console.log(model);
  },
});
// ...
```

---

## Validation

[Codepen](https://codepen.io/falkonpunch/pen/vYXrKgQ?editors=0011).

The hook function takes two additional optional fields

- `validations`, which is an object that will help you set custom validations for each field.
- `onSubmitError`, a helpful handler to deal with submit errors.

#### Validations

The validations object will have the same keys as your model object. Each key can take one of the following values:

- A string that contains prebuild usual validations like `required, email, number, json, website, etc.`
- A custom validation function with the signature `(value): string[] => {}`. The value parameters is useful to suply the updated model and make comparisons. For this validation to report an error you have to return an array of strings. Each string is supposed to be an error that you can later display in the UI.
- An array which can contain the previous both.

```ts
const { model, fields, onSubmit, valid } = reactUseFormLibrary.useForm({
  model: {
    name: '',
    phone: '',
    email: '',
    emailConfirmation: '' ,
  },
  validations: {
    // A single string
    name: 'required',
    // A function
    phone: (model) => {
      if (isNaN(model.phone)) {
        return ['not a number'];
      }
    },
    // A combination
    email: ['required', 'email']
    emailComfirmation: [
      'required',
      'email',
      (model) => {
        if (model.email !== model.emailConfirmation) {
          return ['Email must be the same']
        }
      }
    ]
  },
});
```

---

## Advanced example

```ts
import { useForm } from 'react-use-form-library';

const { fields, dirty, valid, onSubmit, submitting } = useForm({
  model: {
    name: '',
    age: 25,
  },
  handleSubmit: async (form) => {
    if (form.valid) {
      if (newItem) {
        // You can use here the updated model, which includes the original model and any changes made
        await addItem(form.model);
      } else {
        // For updating, you can use only the changes that were made
        await updateItem(form.changes);
      }
      // If you need to clear the fields, you can call on reset form
      form.reset();
    } else {
      // Handle any errors
      throw new Error('invalid form');
    }
  },
});

// On the component
<div>
  <form onSubmit={onSubmit}>
    <input
      value={fields.name.value}
      onChange={(v) => fields.name.onChange(v.target.value)}
    />
    // You can use submitting to display loading state
    {submitting ? (
      <div>Loading...</div>
    ) : (
      // Valid state can also be used to disable submit
      <button disabled={!valid || !dirty}>Submit</button>
    )}
  </form>
</div>;
```

---

## API

### useForm

#### Props

| Property      | Details                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| model         | Your form model, it should be an object (can be empty). Every property will be mapped into a field.              |
| handleSubmit  | Your custom submit function. It will be parsed internally and provide a onSubmit handler to call programaticaly. |
| onSubmitError | A useful handler to deal with errors.                                                                            |
| validations   | A validations object.                                                                                            |

### Form

| Property   | Details                                                               |
| ---------- | --------------------------------------------------------------------- |
| changes    | A plain object that contains only the modified fields                 |
| model      | An updated object that contains the updated model                     |
| fields     | A mapped collection, which has a FormField for every key in the model |
| dirty      | a getter checking if there are any changes                            |
| valid      | a getter checking if all **required** fields are valid                |
| onSubmit   | a method that triggers the function passed as handleSubmit param.     |
| submitting | a loading state for the onSubmit method                               |
| reset      | this helper method will reset every field to it's original value      |

### Form Field

| Property   | Details                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| name       | a string containing the key of the current field in the model                          |
| value      | the updated value of the current field                                                 |
| touched    | a touched state, initially false and changed to true when calling onChange/onBlur      |
| required   | a required field useful to determine a valid state for the form                        |
| errors     | a string array containing any errors                                                   |
| validation | a validation object that is triggered on every update                                  |
| onChange   | a value change method, sets touched to true and triggers an update                     |
| onBlur     | this method only sets the touched state to true and triggers an update                 |
| hasValue   | a helper method to determine empty state. Checks for empty strings                     |
| validate   | a validation function triggered on every update                                        |
| reset      | a helper method that resets the field to it's original value                           |
| valid      | a getter that checks if the field has any errors                                       |
| dirty      | a getter that compares the current value to the original value passed on instantiation |

## Development

Install dependencies with `yarn install`. You can run interactive tests with `yarn test` and lint your project with `yarn lint`.

If you work with VSCode, it automatically switches to the correct TS version and formats on save via prettier. There is also an included launch config, so you can run and debug tests.

The [VSCode Jest Extension](https://github.com/jest-community/vscode-jest) is highly recommended as it gives you inline test results, code coverage and debugging right within VSCode (VSCode will automatically prompt you to install this extension).
