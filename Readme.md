# React Use Form Library

A simple form libray for React using hooks

## Basic example

```
import { useForm } from 'react-use-form-library';

const { model, fields, onSubmit, submitError } = useForm({
  model: {
    textfield: '',
  },
  handleSubmit: async () => {
    console.log(model);
  },
});
```

## Development

Install dependencies with `yarn install`. You can run interactive tests with `yarn test` and lint your project with `yarn lint`.

If you work with VSCode, it automatically switches to the correct TS version and formats on save via prettier. There is also an included launch config, so you can run and debug tests.

The [VSCode Jest Extension](https://github.com/jest-community/vscode-jest) is highly recommended as it gives you inline test results, code coverage and debugging right within VSCode (VSCode will automatically prompt you to install this extension).