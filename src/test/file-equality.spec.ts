import { Form } from '../form';
import { isEqual } from '../util';

describe('isEqual', () => {
  it('compares plain objects structurally (key-order independent, undefined ≡ missing)', () => {
    expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(isEqual({ de: 'x' }, { de: 'x', en: undefined })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('compares Dates by time', () => {
    expect(isEqual(new Date(0), new Date(0))).toBe(true);
    expect(isEqual(new Date(0), new Date(1))).toBe(false);
  });

  it('compares arrays element-wise', () => {
    expect(isEqual([1, { a: 1 }], [1, { a: 1 }])).toBe(true);
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('compares Files by reference, not by JSON serialization', () => {
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    expect(isEqual(a, a)).toBe(true);
    expect(isEqual(a, new File(['b'], 'b.png', { type: 'image/png' }))).toBe(
      false
    );
    expect(isEqual(a, {} as unknown as File)).toBe(false);
  });
});

describe('dirty tracking with a File field', () => {
  it('detects swapping one File for another and resets cleanly', () => {
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    const b = new File(['b'], 'b.png', { type: 'image/png' });
    const form = new Form<{ image: File }>({
      model: { image: a },
      validations: {},
    });

    expect(form.fields.image.dirty).toBe(false);

    form.fields.image.onChange(b);
    expect(form.fields.image.dirty).toBe(true);
    expect(form.changes.image).toBe(b);

    form.fields.image.reset();
    expect(form.fields.image.dirty).toBe(false);
  });
});
