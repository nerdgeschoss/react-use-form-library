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
