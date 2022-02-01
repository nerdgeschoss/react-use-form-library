import React from 'react';
import ReactDOM from 'react-dom';
import { useForm } from '../src/index';
import { NestedField } from './nested-field';
import { NullableField } from './nullable-field';
import { ObjectsArray } from './objects-array';
import { SimpleArray } from './simple-array';
import { SimpleFields } from './simple-fields';
import { SimpleObject } from './simple-object';

const examples = [
  'simple-fields',
  'simple-array',
  'objects-array',
  'nested-field',
  'nullable-field',
  'simple-object',
];

function App(): JSX.Element {
  return (
    <>
      <h1>Form Examples</h1>
      <ul>
        {examples.map((example) => {
          return (
            <li key={example}>
              <a href={`#${example}`}>
                {example
                  .split('-')
                  .map((item) => `${item[0].toUpperCase()}${item.slice(1)}`)
                  .join(' ')}
              </a>
            </li>
          );
        })}
      </ul>
      <div>
        <SimpleFields />
        <SimpleArray />
        <ObjectsArray />
        <NestedField />
        <NullableField />
        <SimpleObject />
      </div>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
