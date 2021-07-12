import React from 'react';
import { InputProps } from './Input';

export function NumberInput({
  label,
  value,
  errors,
  valid,
  touched,
  onBlur,
  onChange,
  onRemove,
}: InputProps<number>): JSX.Element {
  return (
    <div className={!touched ? 'idle' : !valid ? 'invalid' : 'valid'}>
      <div>
        <label>{label}</label>
        <input
          onBlur={onBlur}
          value={value}
          onChange={(v) => onChange(Number(v.target.value))}
          type="number"
        />
        {onRemove && (
          <button type="button" onClick={() => onRemove()}>
            x
          </button>
        )}
      </div>
      {touched && errors.map((error) => <small key={error}>* {error}</small>)}
    </div>
  );
}
