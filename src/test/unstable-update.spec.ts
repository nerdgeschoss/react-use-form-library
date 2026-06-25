import { Form } from '../form';

describe('updateOriginalModel reconcile', () => {
  it('keeps an in-flight File edit while adopting an upstream change to a sibling field', () => {
    const fileA = new File(['a'], 'a.png', { type: 'image/png' });
    const fileB = new File(['b'], 'b.png', { type: 'image/png' });
    const form = new Form<{ image: File; title: string }>({
      model: { image: fileA, title: 'T0' },
      validations: {},
    });

    form.fields.image.onChange(fileB);

    // Server data changes only the sibling `title`; the image is untouched there.
    form.updateOriginalModel({ image: fileA, title: 'T1' });

    expect(form.model.image).toBe(fileB); // edit preserved
    expect(form.model.title).toBe('T1'); // upstream change adopted
  });

  it('does not discard an edit when reconciled repeatedly with an unchanged model', () => {
    const form = new Form<{ status: string }>({
      model: { status: 'draft' },
      validations: {},
    });

    form.fields.status.onChange('published');

    // The hook calls this on every render the external model is unchanged.
    for (let i = 0; i < 3; i++) {
      form.updateOriginalModel({ status: 'draft' });
    }
    expect(form.model.status).toBe('published');
    expect(form.dirty).toBe(true);

    // Once the external model genuinely catches up, the field becomes clean.
    form.updateOriginalModel({ status: 'published' });
    expect(form.dirty).toBe(false);
  });
});
