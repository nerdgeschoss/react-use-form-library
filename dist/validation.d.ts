export declare type ValidationFunction<T> = (value?: T) => string[];
export declare type ValidationStrings = 'required' | 'json' | 'email';
export declare type CustomValidationMessages = {
    [key in ValidationStrings]: string;
};
export declare type FieldValidation<T> = Array<ValidationStrings | ValidationFunction<T>>;
export declare type MappedValidation<T> = {
    [P in keyof T]: FieldValidation<T>;
};
export declare function validateValue<T>({ value, type, messages, }: {
    value?: T;
    type: ValidationStrings;
    messages?: CustomValidationMessages;
}): string | undefined;
