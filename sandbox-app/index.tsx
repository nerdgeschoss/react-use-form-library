import { NestedField } from './nested-field';
import { NestedValidation } from './nested-validation';
import { NullableField } from './nullable-field';
import { ObjectsArray } from './objects-array';
import { OnChange } from './on-change';
import React from 'react';
import ReactDOM from 'react-dom';
import { SimpleArray } from './simple-array';
import { SimpleDelayedFields } from './simple-delayed-fields';
import { SimpleFields } from './simple-fields';
import { SimpleObject } from './simple-object';

const examples = [
  'simple-fields',
  'simple-delayed-fields',
  'simple-array',
  'objects-array',
  'nested-field',
  'nullable-field',
  'simple-object',
  'on-change',
];

function App(): JSX.Element {
  return (
    <>
      <h1>Form Examples</h1>
      <ul>
        {examples.map((example) => {
          return (
            <li key={example}>
              <a href={`#${example}`} style={{ textTransform: 'capitalize' }}>
                {example.split('-').join(' ')}
              </a>
            </li>
          );
        })}
      </ul>
      <div>
        <SimpleFields />
        <SimpleDelayedFields />
        <SimpleArray />
        <ObjectsArray />
        <NestedField />
        <NullableField />
        <SimpleObject />
        <NestedValidation />
        <OnChange />
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
