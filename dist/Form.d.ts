import { MappedValidation, CustomValidationMessages } from './validation';
import { FormModel } from './types';
interface UseFormProps<T> {
    model: T;
    handleSubmit?: () => Promise<void>;
    validations?: Partial<MappedValidation<T>>;
    validationMessages?: CustomValidationMessages;
}
export declare function useForm<T>({ model, handleSubmit, validations, validationMessages, }: UseFormProps<T>): FormModel<T>;
export {};
