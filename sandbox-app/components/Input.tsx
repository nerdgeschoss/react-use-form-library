import React from 'react';

export interface InputProps<T> {
  label?: string;
  value?: T;
  errors: string[];
  onBlur: () => void;
  onChange: (value: T) => void;
  isTouched: () => boolean;
  onRemove?: () => void;
}

export function Input({
  label,
  value,
  errors,
  onBlur,
  onChange,
  isTouched,
  onRemove,
}: InputProps<string>): JSX.Element {
  return (
    <div>
      <div>
        <label>{label}</label>
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
      {isTouched() &&
        errors.map((error) => <small key={error}>* {error}</small>)}
    </div>
  );
}
