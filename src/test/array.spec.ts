import { createForm, tracker } from './util';

import { Form } from '../form';

describe(Form, () => {
  beforeEach(() => tracker.reset());

  describe('fields array', () => {
    describe('creating', () => {
      it('creates empty array', () => {
        const form = createForm();
        const emails = form.fields.emails;
        expect(emails.elements).toBeDefined();
        expect(Array.isArray(emails.elements)).toEqual(true);
        expect(emails.elements.length).toEqual(0);
      });
      it('adds a new field', () => {
        const form = createForm();
        const emails = form.fields.emails;
        emails.add('test');
        expect(emails.value.length).toEqual(1);
        expect(emails.elements.length).toEqual(1);
        expect(emails.elements[0].value).toEqual('test');
      });
      it('creates FormField for each element of the array', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        expect(emails.elements[0].value).toEqual('google.com');
        expect(emails.elements[1].value).toEqual('facebook.com');
      });
    });
    describe('updating', () => {
      it('updates every field', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        emails.onChange(['linkedin.com', 'twitter.com']);
        expect(emails.elements[0].value).toEqual('linkedin.com');
        expect(emails.elements[1].value).toEqual('twitter.com');
      });
      it('creates new fields when mass updating', () => {
        const form = createForm({
          value: { emails: [] },
        });
        const emails = form.fields.emails;
        emails.onChange(['linkedin.com', 'twitter.com']);
        expect(emails.elements[0].value).toEqual('linkedin.com');
        expect(emails.elements[1].value).toEqual('twitter.com');
      });
      it('resets all fields', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        emails.elements[0].onChange('linkedin.com');
        emails.elements[1].onChange('twitter.com');
        emails.reset();
        expect(emails.elements[0].value).toEqual('google.com');
        expect(emails.elements[1].value).toEqual('facebook.com');
      });
      it('touches every field', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        expect(emails.elements[0].touched).toEqual(false);
        emails.touch();
        expect(emails.elements[0].touched).toEqual(true);
        expect(emails.touched).toEqual(true);
      });
    });
    describe('deleting', () => {
      // DELETE
      it('removes a field', () => {
        const form = createForm({
          value: { emails: ['hello'] },
        });
        const emails = form.fields.emails;
        expect(emails.elements.length).toEqual(1);
        emails.add('test');
        expect(emails.elements.length).toEqual(2);
        emails.elements[1].remove();
        expect(emails.elements.length).toEqual(1);
        expect(emails.value).toEqual(['hello']);
      });
    });
    describe('validating', () => {
      it('validates fields', () => {
        const form = createForm({
          value: { emails: ['google@gmail.com', 'facebook@gmail.com'] },
          validations: {
            emails: 'email',
          },
        });
        const emails = form.fields.emails;
        emails.elements[0].onChange('test');
        expect(emails.elements[0].valid).toEqual(false);
        emails.elements[1].onChange('test');
        expect(emails.elements[1].valid).toEqual(false);
        expect(emails.valid).toEqual(false);
      });
      it('has the correct value', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        emails.onChange(['linkedin.com', 'twitter.com']);
        expect(emails.value.length).toEqual(2);
        expect(emails.value[0]).toEqual('linkedin.com');
        expect(emails.value[1]).toEqual('twitter.com');
      });
      it('is dirty', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        expect(emails.dirty).toBeFalsy();
        emails.elements[0].onChange('linkedin.com');
        expect(emails.elements[0].dirty).toBeTruthy();
        expect(emails.elements[1].dirty).toBeFalsy();
        expect(emails.dirty).toBeTruthy();
        expect(form.dirty).toBeTruthy();
      });
      it('is dirty when adding fields', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        expect(emails.dirty).toBeFalsy();
        emails.add('instagram.com');
        expect(emails.dirty).toBeTruthy();
        expect(form.dirty).toBeTruthy();
      });
      it('is dirty when removing fields', () => {
        const form = createForm({
          value: { emails: ['google.com', 'facebook.com'] },
        });
        const emails = form.fields.emails;
        expect(emails.dirty).toBeFalsy();
        emails.elements[0].remove();
        expect(emails.dirty).toBeTruthy();
        expect(form.dirty).toBeTruthy();
      });
      it('handles nested validation', () => {
        const form = createForm({
          value: {
            address: {
              streetName: '',
            },
          },
          validations: {
            address: {
              streetName: 'required',
            },
          },
        });
        expect(form.fields.address.fields.streetName.errors).toHaveLength(1);
        expect(form.fields.address.fields.streetName.errors[0]).toBe(
          'required-field'
        );
      });
    });
  });
});
