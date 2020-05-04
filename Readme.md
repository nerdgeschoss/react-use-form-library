# React Use Form Library

![Tests](https://github.com/nerdgeschoss/react-use-form-library/workflows/Tests/badge.svg)

A simple form libray for React using hooks

## Basic example

```ts
import { useForm } from 'react-use-form-library';

const { model, fields, onSubmit } = useForm({
  model: {
    name: '',
  },
  handleSubmit: async () => {
    console.log(model);
  },
});

// On the component
<form onSubmit={onSubmit}>
  <input
    value={fields.name.value}
    onChange={(v) => fields.name.onChange(v.target.value)}
  />
  <button>Submit</button>
</form>;
```

## Advanced example

```ts
import { useForm } from 'react-use-form-library';

const { fields, dirty, valid, onSubmit, submitting, submitError } = useForm({
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
      // Any errors thrown within this function will be stored in the submitError property
      throw new Error('invalid form');
    }
  },
});

// On the component
<div>
  // Display any error
  {submitError && <div>{submitError}</div>}
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

### Form Model

| Property    | Details                                                               |
| ----------- | --------------------------------------------------------------------- |
| changes     | A plain object that contains only the modified fields                 |
| model       | An updated object that contains the updated model                     |
| fields      | A mapped collection, which has a FormField for every key in the model |
| dirty       | a getter checking if there are any changes                            |
| valid       | a getter checking if all **required** fields are valid                |
| onSubmit    | a method that triggers the function passed as handleSubmit param.     |
| submitError | contains any error stored by the onSubmit method                      |
| submitting  | a loading state for the onSubmit method                               |
| reset       | this helper method will reset every field to it's original value      |

### Form Field Model

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
