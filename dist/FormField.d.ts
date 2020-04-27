import { FieldValidation, CustomValidationMessages } from './validation';
export declare class FormField<T> {
    name: string;
    value?: T;
    touched: boolean;
    required: boolean;
    dirty: boolean;
    errors: string[];
    private onUpdate;
    onFocus?: () => void;
    constructor({ name, value, required, onUpdate, }: {
        name: string;
        value: T;
        required: boolean;
        onUpdate: () => void;
    });
    onChange(value?: T): void;
    onBlur(): void;
    hasValue(): boolean;
    validate<M>({ model, validation, messages, }: {
        model: M;
        validation?: FieldValidation<M>;
        messages?: CustomValidationMessages;
    }): void;
    get valid(): boolean;
}
