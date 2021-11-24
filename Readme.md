# React Use Form Library

![Tests](https://github.com/nerdgeschoss/react-use-form-library/workflows/Tests/badge.svg)

A simple form libray for React using hooks.

## Motivation

The motivation for working on this solution for form handling comes from the fact that we wanted something very simple and straighforward to use, while also being as agnostic to the implementation as possible, to make it easy to integrate in every kind of project.

Contrary to other solutions that provide you with react components and/or wrappers, we went for a simple react hook that gives you all the tools needed to implement your forms as you see fit.

- Easy to use: you supply a model and a submit function to the hook and you get back helpers to use in your inputs.
- Small: the codebase is quite simple and small. Currently only under [7kb gzipped](https://bundlephobia.com/result?p=react-use-form-library).
- Declarative: we use the same handlers as the native inputs { value, onChange, onBlur }.

## Table of Contents

1. [Installation](#installation)
2. [Basic Example](#basic-example)
3. [Optional fields](#optional-fields)
4. [Validation](#validation)
5. [Error Handling](#error-handling)
6. [Advanced Example](#advanced-example)
7. [Nested Objects](#nested-objects)
8. [Array values (FieldSet)](#fieldset)
9. [API](#api)
10. [Development](#development)

## Installation

Add the library to your project:

`yarn add @nerdgeschoss/react-use-form-library`

or

`npm install @nerdgeschoss/react-use-form-library`

## Basic example

[Codepen](https://codepen.io/falkonpunch/pen/oNzyvQG)

To initialize the hook you will need to supply a valid `model` object and a custom `handleSubmit` function.

The three main fields you get from the hook are `model`, `fields` and `onSubmit`.

- `model` is the updated object which will contain the modified fields.
- `fields` is an object in which each key will be generated from properties of the original model you supplied to the hook.
- `onSubmit` is the handler you can provide to the `<form>` element. It will call `preventDefault` internally and execute the function provided to the hook as `handleSubmit`

```ts
import { useForm } from '@nerdgeschoss/react-use-form-library';

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

<p>&nbsp</p>

---

<p>&nbsp</p>

## Optional Fields

You don't need to explicitly enumerate all properties in your model, the library will generate all necesary fields on demand by using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

```ts
import { useForm } from '@nerdgeschoss/react-use-form-library';

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
// ...
const { model, fields, onSubmit } = useForm<{ name: string; phone: number }>({
  model: {},
  handleSubmit: async () => {
    console.log(model);
  },
});
// ...
```

<p>&nbsp</p>

---

<p>&nbsp</p>

## Validation

[Codepen](https://codepen.io/falkonpunch/pen/vYXrKgQ?editors=0011)

The validations object needs to correspond your model object. Each key can take one of the following values:

- A string that contains prebuild common validations. Currently supported are: `required`, `email`, `number` and [more](#predefined-validation-strings).
- A custom validation function with the signature `(value: model): string[] => {}`. The value parameter is useful to supply the updated model and make comparisons. For this validation to report an error you have to return an array of strings. Each string is supposed to be an error that you can later display in the UI.
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

<p>&nbsp</p>

#### Predefined validation strings

| Property | Details                                                |
| -------- | ------------------------------------------------------ |
| required | checks if the field is not empty.                      |
| email    | checks if the value is a valid email address.          |
| json     | checks if the value is a valid json object.            |
| website  | checks if the value is a valid website (http / https). |
| number   | checks if the value is a number.                       |

<p>&nbsp</p>

---

<p>&nbsp</p>

## Submit Error Handling

[Codepen](https://codepen.io/falkonpunch/pen/jOMKMxz?editors=0010)

The hook also exposes another method: `onSubmitError`, which is handy if you don't want to use a try/catch in your `handleSubmit` function.

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

<p>&nbsp</p>

---

<p>&nbsp</p>

## Form state

[Codepen](https://codepen.io/falkonpunch/pen/PoGaayB?editors=0010)

There are several properties exposed from the hook to deal with the state throughout the form lifetime

| Property         | Details                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| dirty            | A boolean value indicating that one or more fields have been changed                                   |
| valid            | A boolean indicating that the form is valid or not, this one depends on the validation rules provided. |
| error            | any error thrown within the handleSubmit function is stored here as an error object                    |
| submissionStatus | Displays the current status of the submission process                                                  |

<p>&nbsp</p>

#### Submission Status

This variable contains the current state of the form submission process. At any time the form will be in one of the following states:

| Status     | Details                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| idle       | The form has not yet been submitted. It also applied when the form is reset |
| submitting | The form is being submitted. This works like a loading state.               |
| submitted  | The form has been successfully submitted.                                   |
| error      | There is an error while submitting.                                         |

<p>&nbsp</p>

#### Reset

Sometimes it is useful to reset the form programatically. For this there are two helpful methods:

| Property   | Details                    |
| ---------- | -------------------------- |
| reset      | Clears all fields.         |
| resetError | Removes the current error. |

<p>&nbsp</p>

---

<p>&nbsp</p>

## Fields

[Codepen](https://codepen.io/falkonpunch/pen/JjRZwZq?editors=0010)

Every key supplied to the model property of the hook will be parsed into a [field](#form-field)

```ts
// ...
const { fields } = useForm({
  model: {
    name: '',
  },
});
// ...
```

A field will be an object that you can use in a simple setup like:

```ts
// ...
<input
  // The updated value
  value={fields.phone.value}
  // A function to modify the value
  onChange={(v) => fields.phone.onChange(v.target.value)}
/>
// ...
```

Or a more complex solution:

```ts
// ...
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
// ...
```

<p>&nbsp</p>

### Helpful properties

#### touched

If the field is required, the `required-field` error will always be present if the value is empty. It is good UX to only display the required error if the field has been touched, for this you can use the `touched` property which will be true once the field has lost focus for the first time (`onBlur` event).

**Important !!**

If you want to immediately display errors based on the touched property, you need to add the `onBlur` event to your input. Otherwise it will only be displayed after an `update` event triggered by `onChange`.

Submitting the form will also "touch" all fields, to make sure errors are displayed if the form is invalid.

```ts
// ...
const displayErrors = fields.name.touched && fields.name.errors.length;

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
// ...
```

<p>&nbsp</p>

#### valid

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

<p>&nbsp</p>

#### dirty

When instantiated, a field will store it's original value in a variable. This getter will then compare the original value to the current value and return true if they are different.

<p>&nbsp</p>

---

<p>&nbsp</p>

## Advanced example

```ts
import { useForm } from '@nerdgeschoss/react-use-form-library';

export function MyForm({ isNewItem, addItem, updateItem }: Props): JSX.Element => {
  const { model, changes, reset, fields, dirty, valid, onSubmit, submissionStatus } = useForm({
    model: {
      name: '',
      age: 25,
    },
    handleSubmit: async () => {
      if (valid) {
        if (isNewItem) {
          // You can use here the updated model, which includes the original model and any changes made
          await addItem(model);
        } else {
          // For updating, you can use only the changes that were made
          await updateItem(changes);
        }
        // If you need to clear the fields, you can call on reset form
        reset();
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
        <input
          value={fields.age.value}
          // Make sure you parse the value to be consistent with the model
          onChange={(v) => fields.age.onChange(Number(v.target.value))}
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

<p>&nbsp</p>

---

<p>&nbsp</p>

## Nested Objects

Each FormField object is also able to contain fields. It behaves similarly to the Form object but with slight differences in its methods (See [API](#nested-fields)).

```ts
import { useForm } from '@nerdgeschoss/react-use-form-library';

function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    model: {
      address: {
        streetName: '',
      },
    },
    handleSubmit: async () => {
      console.log(model);
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        value={fields.address.fields.streetName.value}
        onChange={(v) =>
          fields.address.fields.streetName.onChange(v.target.value)
        }
      />
      <button>Submit</button>
    </form>
  );
}
```

Validations also work with nested objects

```ts
import { useForm } from '@nerdgeschoss/react-use-form-library';

function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    model: {
      address: {
        streetName: '',
      },
    },
    handleSubmit: async () => {
      console.log(model);
    },
    validations: {
      address: {
        streetName: 'required',
      },
    }
  });

  // ...
```

Since the fields property within FormField is also based on a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object, you can access nested properties without
explicitely declaring them

```ts
function App(): JSX.Element {
  /* If you use Typescript you have to define the model interface, otherwise you'll get an error
  while trying to access the nested properties */
  const { model, fields, onSubmit } = useForm<{
    bankDetails: {
      address: {
        screetName: string;
      };
    };
  }>({
    model: {},
    handleSubmit: async () => {
      console.log(model);
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <input
        value={fields.bankDetails.fields?.address.fields?.streetName.value}
        onChange={(v) =>
          fields.bankDetails.fields?.address.fields?.streetName.onChange(
            v.target.value
          )
        }
      />
      <button>Submit</button>
    </form>
  );
}
```

<p>&nbsp</p>

---

<p>&nbsp</p>

## FieldSet

A FieldSet is basically an array of FormFields. Contrary to nested objects, a FieldSet will only be instantiated if it is **explicitly** declared in the model.

**Important !!**

If you don't initialize the property in the model and try to access it in your code you will get an error.

This is because at the moment of field instantiation, the `addField` method within a `Form` (or a `FormField` if it is a nested object) will ask if the model value is actually an Array. It is not possible to **implicitly** determine if the field is array-based only from the type definition.

```ts
const { fields } = useForm<{ emails: string[]; images: string[] }>({
  model: {
    images: [],
  },
});

return (
  <form onSubmit={onSubmit}>
    /* This will result in an error because emails has been instantiated as a
    FormField not as a FieldSet */
    {fields.emails.fields.map((field) => {
      // ...
    })}
    /* This will work as intented */
    {fields.images.fields.map((field) => {
      // ...
    })}
  </form>
);
```

The `FieldSet` object has a `fields` property, which is an array of `FormField` (more in the [API](#fieldset-1))

```ts
function App(): JSX.Element {
  const { model, fields, onSubmit } = useForm({
    model: {
      emails: ['example@email.com'],
    },
    handleSubmit: async () => {
      console.log(model);
    },
  });

  return (
    <form onSubmit={onSubmit}>
      // a FieldSet fields property is iterable
      {fields.emails.fields.map((field) => {
        // Every FieldSet field is a FormField
        return (
          <div className="input">
            <input
              value={field.value}
              onChange={(v) => field.onChange(v.target.value)}
            />
            // FormFields regenerated from a FieldSet also have a remove method
            <button onClick={() => field.remove()}>remove</button>
          </div>
        );
      })}
      // FieldSet also has an insert method to create new items
      <button onClick={() => fields.emails.insert('')}>Add Field</button>
      <button>Submit</button>
    </form>
  );
}
```

<p>&nbsp</p>

### Adding Items

The `insert` can be called with one or more items.

```ts
// simple value
<button onClick={() => fields.emails.insert('example@email.com')}>Add Field</button>
// Multiple Fields
<button onClick={() => fields.emails.insert('example@email.com', '', 'another-example@email.com')}>Add Field</button>
```

**Important !!**

`insert` takes a comma separated array of parameters, if you would like to pass an array you will need to destructure it.

```ts
const newValues = ['example@email.com', '', 'another-example@emal.com'];
<button onClick={() => fields.emails.insert(...newValues)}
```

<p>&nbsp</p>

### Removing Items

`FormField` objects inside a `FieldSet` include a `remove` method, that compares the instance with the items in the `fields` collection inside `FieldSet` and filters it out.

```ts
<button onClick={() => fields.emails.fields[0].remove()}>remove</button>
```

<p>&nbsp</p>

### Validating a FieldSet

A `FieldSet` takes the same kind of validation as any other field. On instantiation it will be saved in memory and it will
be further applied to any new field created.

```ts
const { model, fields, onSubmit, valid } = useForm({
  model: {
    // Initialize the field
    emails: [],
  },
  validations: {
    // Will be applied to any item added to emails
    emails: ['required', 'email'],
  },
});
```

If the validation is of the type `required`, it will also make the field invalid unless it has at least one element.

```ts
const { model, fields, onSubmit, valid } = useForm({
  model: {
    // emails.valid will be false because we're initializing it with no elements.
    emails: [],
  },
  validations: {
    emails: 'required',
  },
});
```

<p>&nbsp</p>

### Advanced FieldSet

A common escenario would be to have an array of objects in your model.

```ts
const { model, fields, onSubmit, valid } = useForm<{
  images: Array<{
    id: string;
    url: string;
  }>;
}>({
  model: {
    // Initialize the field
    images: [],
  },
});

return (
  <form onSubmit={onSubmit}>
    {fields.images.fields.map((field) => {
      return (
        <div className="input">
          /* You can access a property whithin the field, as you would with a
          nested object */
          <input
            value={field.fields.url.value}
            onChange={(v) => field.fields.url.onChange(v.target.value)}
          />
          <button onClick={() => field.remove()}>remove</button>
        </div>
      );
    })}
    <button
      onClick={() =>
        fields.images.insert({
          id: generateId(),
        })
      }
    >
      Add Field
    </button>
    <button>Submit</button>
  </form>
);
```

<p>&nbsp</p>

---

<p>&nbsp</p>

## API

### useForm

#### Props

| Property      | Details                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| model         | Your form model, it should be an object (can be empty). Every property will be mapped into a field.              |
| handleSubmit  | Your custom submit function. It will be parsed internally and provide a onSubmit handler to call programaticaly. |
| onSubmitError | A useful handler to deal with errors.                                                                            |
| validations   | A validations object.                                                                                            |

<p>&nbsp</p>

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

<p>&nbsp</p>

### Form Field

| Property   | Details                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| value      | the updated value of the current field                                                                       |
| required   | a required field useful to determine a valid state for the form                                              |
| errors     | a string array containing any errors                                                                         |
| validation | a validation object that is triggered on every update                                                        |
| focused    | a boolean stating if the field is currently in focus, you'll need to use onFocus/onBlur to change this state |
| onChange   | a value change method, sets touched to true and triggers an update                                           |
| onBlur     | this method sets the touched state to true and focused to false                                              |
| onFocus    | sets focused to true                                                                                         |
| hasValue   | a helper method to determine empty state. Checks for empty strings                                           |
| validate   | a validation function triggered on every update                                                              |
| setTouched | takes a boolean and will set the touched state to this value                                                 |
| reset      | a helper method that resets the field to it's original value                                                 |
| valid      | a getter that checks if the field has any errors                                                             |
| dirty      | a getter that compares the current value to the original value passed on instantiation                       |
| touched    | a touched state, initially false and changed to true when calling onChange/onBlur                            |
| remove     | Only within a `FieldSet`, it removes the object from the collection                                          |

<p>&nbsp</p>

### Nested Fields

These following methods will behave differently if the FormField has nested fields

| Property   | Details                                                                            |
| ---------- | ---------------------------------------------------------------------------------- |
| onChange   | It takes an object and will create/update every field from the keys of this object |
| hasValue   | It is true when all fields have value                                              |
| validate   | It will run validations for all nested fields                                      |
| setTouched | Takes a booleand and will set every nested field touched property to this value    |
| reset      | It resets the value of every nested field                                          |
| touched    | Will be touched when every fields is touched                                       |
| valid      | Will be valid when every fields is touched                                         |
| dirty      | Will be valid when at least one field is dirty                                     |
| fields     | A mapped collection, which has a FormField for every key in the value              |

<p>&nbsp</p>

### FieldSet

| Property    | Details                                                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fields      | An array of FormField objects                                                                                                                                                                      |
| onChange    | Useful to update many fields at the same time. It takes an array value and will update every field based on the index. If the passed array is longer than the generated items, it will create more |
| setTouched  | It takes a boolean parameter and will set every item touched property to this value                                                                                                                |
| reset       | It resets every field                                                                                                                                                                              |
| validate    | It validates every field                                                                                                                                                                           |
| insert      | It takes a comma separated array of arguments and adds a new FormField for each value                                                                                                              |
| removeField | It removes a field given an object reference value                                                                                                                                                 |
| value       | It returns an array with the value of every FormField item                                                                                                                                         |
| dirty       | Will be true if any item is dirty                                                                                                                                                                  |
| touched     | Will be true if every item is touched                                                                                                                                                              |

<p>&nbsp</p>

---

<p>&nbsp</p>

## Development

Install dependencies with `yarn install`. You can run interactive tests with `yarn test` and lint your project with `yarn lint`.

If you work with VSCode, it automatically switches to the correct TS version and formats on save via prettier. There is also an included launch config, so you can run and debug tests.

The [VSCode Jest Extension](https://github.com/jest-community/vscode-jest) is highly recommended as it gives you inline test results, code coverage and debugging right within VSCode (VSCode will automatically prompt you to install this extension).

Releases are done via GitHub Releases. Create a new release there, this will automatically trigger a workflow to publish the package.

<p>&nbsp</p>

### Sandbox App

There is a also a sandbox basic application to play around with the library. Use `yarn dev` to start up the parcel server, and you can find the files inside the `/sandbox-app` folder.

#### Troubleshoot

Sometimes you may get the following bug/error from parcel:

```
Conflicting babel versions found in .babelrc.
```

To solve this, after you started the dev server, go to the `.babelrc` file and comment these two lines:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-typescript"],
  "plugins": [
    // "@babel/plugin-transform-runtime",
    // "babel-plugin-transform-class-properties"
  ]
}
```

After the server starts correctly you should uncomment those lines. If you still have some issues, try restarting the dev server.
