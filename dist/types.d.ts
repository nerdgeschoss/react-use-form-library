/// <reference types="react" />
import { FormField } from './FormField';
export declare type MappedFields<T> = {
    [P in keyof T]: FormField<T[P]>;
};
export interface FormModel<T> {
    model: T;
    fields: MappedFields<T>;
    changes: Partial<T>;
    dirty: boolean;
    valid: boolean;
    submitting: boolean;
    submitError?: Error;
    onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void;
    resetForm: () => void;
    updateFields: (model: Partial<T>) => void;
}
