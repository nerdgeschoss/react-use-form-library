import { Form } from './Form';
import { MappedValidation } from './validation';

type VoidFunction = () => void;

class UpdateTracker {
  wasCalled = false;

  onUpdate: VoidFunction = () => {
    this.wasCalled = true;
  };

  reset: VoidFunction = () => {
    this.wasCalled = false;
  };
}

const tracker = new UpdateTracker();

interface Model {
  name: string;
  age?: number;
}

function createForm({
  validations,
  value,
}: {
  value?: Partial<Model>;
  validations?: Partial<MappedValidation<Model>>;
} = {}): Form<Model> {
  const defaultValue = { name: 'John' };
  return new Form<Model>(
    { ...defaultValue, ...(value || {}) },
    tracker.onUpdate,
    validations
  );
}

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('tracking changes', () => {
    it('invokes the callback when a value changes', () => {
      const form = createForm();
      expect(form.fields.name.dirty).toBeFalsy();
      expect(form.fields.name.touched).toBeFalsy();
      form.fields.name.onChange('Freddy');
      // TODO: this should be truthy once the field has changes
      // expect(form.fields.name.dirty).toBeTruthy();
      expect(form.fields.name.touched).toBeTruthy();
      expect(tracker.wasCalled).toBeTruthy();
    });

    it('invokes the callback for undefined values', () => {
      const form = createForm();
      // TODO: the age field should not be optional!
      // expect(form.fields.age).toBeDefined();
      // TODO: get rid of `getFields()` - just use `fields`
      expect(form.getFields().age).toBeDefined();
      expect(form.fields.age?.value).toBeUndefined();
      // TODO: The tracker should not be called if update wasn't called!
      // expect(tracker.wasCalled).toBeFalsy()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      form.getFields().age!.onChange(5);
      expect(tracker.wasCalled).toBeTruthy();
    });

    it('returns a change object on changed values', () => {
      const form = createForm();
      expect(form.getChanges()).toEqual({});
      form.fields.name.onChange('test');
      expect(form.getChanges()).toEqual({ name: 'test' });
    });

    it('resets', () => {
      const form = createForm();
      form.fields.name.onChange('hello');
      // TODO: naming doesn't really make sense - it should be reset
      form.resetForm();
      expect(form.getChanges()).toEqual({});
    });

    it('mass assigns', () => {
      const form = createForm();
      form.updateFields({ name: 'George', age: 5 });
      expect(form.getChanges()).toEqual({ name: 'George', age: 5 });
    });

    it("doesn't track same value as a change", () => {
      const form = createForm();
      form.fields.name.onChange('John');
      // TODO: expose `changed` on each field
      // expect(form.fields.name.changed).toBeTruthy()
      expect(form.getChanges()).toEqual({});
    });
  });

  describe('validating', () => {
    it('uses built in required validations', () => {
      // TODO: also accept a single validation as an agument ({name: 'required'})
      const form = createForm({
        validations: { name: ['required'] },
      });
      expect(form.fields.name.required).toBeTruthy();
      expect(form.valid).toBeTruthy();
      expect(form.fields.name.valid).toBeTruthy();
      // TODO: a required attribute should *not* accept undefined in onChange
      form.fields.name.onChange('');
      // TODO: validateFields() should not be public - this should happen automaticall
      form.validateFields();
      expect(form.valid).toBeFalsy();
    });

    it('uses a built in email validation', () => {
      const form = createForm({
        validations: { name: ['email'] },
      });
      // TODO: this field should be invalid, no matter the touch status
      form.fields.name.onBlur();
      form.validateFields();
      expect(form.valid).toBeFalsy();
      form.fields.name.onChange('test@example.com');
      form.validateFields();
      expect(form.valid).toBeTruthy();
    });

    it('uses a custom validation function', () => {
      const form = createForm({
        validations: { name: [() => ['custom error']] },
      });
      form.fields.name.onBlur();
      form.validateFields();
      expect(form.valid).toBeFalsy();
      expect(form.fields.name.errors).toEqual(['custom error']);
    });
  });
});
