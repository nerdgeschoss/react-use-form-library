# React Use Form Library

![Tests](https://github.com/nerdgeschoss/react-use-form-library/workflows/Tests/badge.svg)

A simple form libray for React using hooks.

## Motivation

The motivation for working on this solution for form handling comes from the fact that we wanted something that is as agnostic to the implementation as possible.
This is a simple react hook that gives you all the tools to implement your forms as you see fit.

- Easy to use: you supply a model and a submit function to the hook and you get back helpers to use in your inputs.
- Small: the codebase is quite simple and small. Only 6.1kb gzipped. [size](https://bundlephobia.com/result?p=react-use-form-library@0.0.21)
- Declarative: we use the same handlers as the native inputs { value, onChange, onBlur }.

## Table of Contents

1. [Installation](#installation)
2. [Basic Example](#basic-example)
3. [Optional fields](#optional-fields)
4. [Validation](#validation)
5. [Error Handling](#error-handling)
6. [Advanced Example](#advanced-example)
7. [API](#api)
8. [Development](#development)

## Installation

Add the library to your project: `yarn add react-use-form-library`

## Basic example

[Codepen](https://codepen.io/falkonpunch/pen/oNzyvQG)

To initialize the hook you will need to supply a valid `model` object and a custom `handleSubmit` function.

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

[Codepen](https://codepen.io/falkonpunch/pen/vYXrKgQ?editors=0011)

The validations object will have the same keys as your model object. Each key can take one of the following values:

- A string that contains prebuild usual validations like `required, email, number, json, website, etc.`
- A custom validation function with the signature `(value): string[] => {}`. The value parameters is useful to supply the updated model and make comparisons. For this validation to report an error you have to return an array of strings. Each string is supposed to be an error that you can later display in the UI.
- An array which can contain the previous both.

```ts
const { model, fields, onSubmit, valid } = useForm({
  model: {
    name: '',
    phone: '',
    customRegex: '',
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
    // A Regex
    customRegex: /[a-g]/,
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

#### Predefined validation strings

| Property | Details                                                |
| -------- | ------------------------------------------------------ |
| required | checks if the field is not empty.                      |
| email    | checks if the value is a valid email address.          |
| json     | checks if the value is a valid json object.            |
| website  | checks if the value is a valid website (http / https). |
| number   | checks if the value is a number.                       |

---

## Submit Error Handling

[Codepen](https://codepen.io/falkonpunch/pen/jOMKMxz?editors=0010)

The useForm hook also exposes another method: `onSubmitError`, which is handy if you don't want to use a try/catch in your `handleSubmit` function

```ts
const { model, fields, onSubmit, valid } = useForm({
  model: {
    name: '',
    phone: '',
  },
  handleSubmit: async () => {
    throw new Error('submit error');
  },
  onSubmitError: (error) => {
    alert('error');
  },
});
```

---

## Form state

[Codepen](https://codepen.io/falkonpunch/pen/PoGaayB?editors=0010)

There are several properties exposed from the hook to deal with the state throughout the form lifetime

| Property         | Details                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| dirty            | A boolean value indicating that one or more fields have been changed                                   |
| valid            | A boolean indicating that the form is valid or not, this one depends on the validation rules provided. |
| error            | any error thrown within the handleSubmit function is stored here as an error object                    |
| submissionStatus | Displays the current status of the submission process                                                  |

#### Submission Status

This variable contains the current state of the form submission process. At any time the form will be in one of the following states:

| Status     | Details                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| idle       | The form has not yet been submitted. It also applied when the form is reset |
| submitting | The form is being submitted. This works like a loading state.               |
| submitted  | The form has been successfully submitted.                                   |
| error      | There is an error while submitting.                                         |

#### Reset

Sometimes it is useful to reset the form programatically. For this there are two helpful methods:

| Property   | Details                    |
| ---------- | -------------------------- |
| reset      | Clears all fields.         |
| resetError | Removes the current error. |

---

## Fields

[Codepen](https://codepen.io/falkonpunch/pen/JjRZwZq?editors=0010)

Every key supplied to the model property of the hook will be parsed into a [field](#form-field)

```ts
const { fields } = reactUseFormLibrary.useForm({
  model: {
    name: '',
  },
});
```

A field will be an object that you can use in a simple setup like:

```ts
<input
  // The updated value
  value={fields.phone.value}
  // A function to modify the value
  onChange={(v) => fields.phone.onChange(v.target.value)}
/>
```

Or a more complex solution:

```ts
<div>
  // The required property is derived from the validation of the field
  <label>Name {fields.name.required ? '(required)' : ''}: </label>
  <input
    value={fields.name.value}
    onChange={(v) => fields.name.onChange(v.target.value)}
  />
  // The errors property is an array of strings with all errors for the field
  {fields.name.errors.length && (
    <div>
      {fields.errors.forEach((error) => {
        return <div>{error}</div>;
      })}
    </div>
  )}
</div>
```

### Helpful properties

#### Touched

If the field is required, the `required-field` error will always be present if the value is empty. It is good UX to only display the required error if the field has been touched, for this you can use the touched property which will be true once the field has lost focus for the first time (`onBlur` event).

If you want to inmediately display errors based on the touched property, you need to add the `onBlur` event to your input. Otherwise submitting the form will also "touch" all fields, to make sure errors are displayed if the form is invalid.

```ts
const displayErrors = fields.name.touched && fields.name.errors.length;

// ...
<div>
  <input
    value={fields.name.value}
    onChange={(v) => fields.name.onChange(v.target.value)}
    onBlur={fields.name.onBlur}
  />
  {
    displayErrors && (
      <div>
        {fields.errors.forEach((error) => {
          return <div>{error}</div>;
        })}
      </div>
    );
  }
</div>
```

#### Valid

A simple getter that returns true if there aren't any errors. This would simplify the above conditional to:

```ts
const displayErrors = fields.name.touched && !fields.name.valid;
```

It is also useful if you want to give your input a conditional class to show the user if the field is valid or not

```ts
<div className={fields.phone.valid ? 'input--valid' : ''}>
  <input
    value={fields.phone.value}
    onChange={(v) => fields.phone.onChange(v.target.value)}
  />
</div>
```

#### Dirty

When instantiated, a field will store it's original value in a variable. This getter will then compare the original value to the current value and return true if they are different.

#### P

---

## Advanced example

```ts
import { useForm } from 'react-use-form-library';

export function MyForm({ isNewItem, addItem, updateItem }: Props): JSX.Element => {
  const { fields, dirty, valid, onSubmit, submissionStatus } = useForm({
    model: {
      name: '',
      age: 25,
    },
    handleSubmit: async (form) => {
      if (form.valid) {
        if (isNewItem) {
          // You can use here the updated model, which includes the original model and any changes made
          await addItem(form.model);
        } else {
          // For updating, you can use only the changes that were made
          await updateItem(form.changes);
        }
        // If you need to clear the fields, you can call on reset form
        form.reset();
      } else {
        // throw custom errors
        throw new Error('invalid form');
      }
    },
    // Handle any errors
    onSubmitError: (error) => {
      alert('error');
    },
  });

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input
          value={fields.name.value}
          onChange={(v) => fields.name.onChange(v.target.value)}
        />
        // You can use submitting to display loading state
        {submissionStatus === 'submitting' ? (
          <div>Loading...</div>
        ) : (
          // Valid state can also be used to disable submit
          <button disabled={!valid || !dirty}>Submit</button>
        )}
      </form>
    </div>
  );
}
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
