import React from 'react';
import './Input.css';

export interface InputProps<T> {
  label?: string;
  value?: T;
  errors: string[];
  required: boolean;
  touched: boolean;
  valid: boolean;
  onBlur: () => void;
  onChange: (value: T) => void;
  onRemove?: () => void;
}

export function Input({
  label,
  value,
  errors,
  required,
  touched,
  valid,
  onBlur,
  onChange,
  onRemove,
}: InputProps<string>): JSX.Element {
  return (
    <div className={!touched ? 'idle' : !valid ? 'invalid' : 'valid'}>
      <div>
        <label>
          {label} {required ? '* ' : ''}
        </label>
        <input
          onBlur={onBlur}
          value={value}
          onChange={(v) => onChange(v.target.value)}
        />
        {onRemove && (
          <button type="button" onClick={() => onRemove()}>
            x
          </button>
        )}
      </div>
      <div>
        {touched && errors.map((error) => <small key={error}>* {error}</small>)}
      </div>
    </div>
  );
}
