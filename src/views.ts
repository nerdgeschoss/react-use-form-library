import { FieldImplementation, MappedFields } from './field';
import { Form } from './form';
import { isObject } from './util';

type AnyField = FieldImplementation<unknown, unknown>;
type AnyForm = Form<unknown>;
type Node = AnyField | AnyForm;
type AnyRecord = Record<PropertyKey, unknown>;

interface NodeState {
  version: number;
  signature: unknown[];
  fields?: Map<string, AnyField>;
  elements?: AnyField[];
}

interface Cached<V> {
  version: number;
  view: V;
}

interface BoundFunction {
  fn: unknown;
  bound: unknown;
}

export interface FormSnapshot<T> {
  model: T;
  fields: MappedFields<T>;
  changes: Partial<T>;
  touchedValues: Partial<T>;
}

export interface FormMethods<T> {
  updateFields: (model: Partial<T>) => void;
  onSubmit: Form<T>['submit'];
  reset: () => void;
  resetError: () => void;
}

function sameSignature(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Gives `useForm` results a new identity whenever their content changes, so
 * memoizing consumers (e.g. the React Compiler) see every change. The views
 * are proxies over the live fields and model: reads and writes behave exactly
 * as on the live objects, only the identity follows the content.
 */
export class FormViews<T> {
  private states = new WeakMap<Node, NodeState>();
  private fieldViews = new WeakMap<Node, Cached<AnyField>>();
  private fieldsViews = new WeakMap<Node, Cached<AnyRecord>>();
  private elementsViews = new WeakMap<Node, Cached<AnyField[]>>();
  private valueViews = new WeakMap<Node, Cached<unknown>>();
  private boundFunctions = new WeakMap<
    object,
    Map<PropertyKey, BoundFunction>
  >();
  private formValues = new WeakMap<
    AnyForm,
    Cached<Pick<FormSnapshot<T>, 'changes' | 'touchedValues'>>
  >();
  private formMethods = new WeakMap<AnyForm, FormMethods<T>>();

  read(form: Form<T>): FormSnapshot<T> {
    const version = this.visit(form as AnyForm);
    let values = this.formValues.get(form as AnyForm);
    if (!values || values.version !== version) {
      values = {
        version,
        view: { changes: form.changes, touchedValues: form.touchedValues },
      };
      this.formValues.set(form as AnyForm, values);
    }
    return {
      model: this.valueView(form as AnyForm) as T,
      fields: this.fieldsView(form as AnyForm) as unknown as MappedFields<T>,
      ...values.view,
    };
  }

  methods(form: Form<T>): FormMethods<T> {
    let methods = this.formMethods.get(form as AnyForm);
    if (!methods) {
      methods = {
        updateFields: form.updateFields.bind(form),
        onSubmit: form.submit.bind(form),
        reset: form.reset.bind(form),
        resetError: form.resetError.bind(form),
      };
      this.formMethods.set(form as AnyForm, methods);
    }
    return methods;
  }

  private visit(node: Node): number {
    const fields = this.liveFields(node);
    const elements = this.liveElements(node);
    const fieldMap = fields
      ? new Map(
          Object.keys(fields).map((key) => [key, fields[key] as AnyField])
        )
      : undefined;
    const children = [...(fieldMap?.values() ?? []), ...(elements ?? [])];
    const childVersions = children.map((child) => this.visit(child));

    const signature: unknown[] =
      node instanceof Form
        ? [node.model]
        : [
            node.value,
            node.touched,
            node.focused,
            node.required,
            node.valid,
            node.dirty,
            node.errors.join('\u0000'),
          ];
    signature.push(...(fieldMap?.keys() ?? []), ...children, ...childVersions);

    const previous = this.states.get(node);
    const version =
      !previous || sameSignature(previous.signature, signature)
        ? previous?.version ?? 0
        : previous.version + 1;
    this.states.set(node, { version, signature, fields: fieldMap, elements });
    return version;
  }

  private version(node: Node): number {
    const state = this.states.get(node);
    return state ? state.version : this.visit(node);
  }

  private cached<V>(
    cache: WeakMap<Node, Cached<V>>,
    node: Node,
    create: () => V
  ): V {
    const version = this.version(node);
    const entry = cache.get(node);
    if (entry && entry.version === version) return entry.view;
    const view = create();
    cache.set(node, { version, view });
    return view;
  }

  private liveValue(node: Node): unknown {
    return node instanceof Form ? node.model : node.value;
  }

  // `field.fields` replaces a falsy value with `{}`, so it is only read for object values.
  private liveFields(node: Node): AnyRecord | undefined {
    if (node instanceof Form) return node.fields as AnyRecord;
    return isObject(node.value) ? (node.fields as AnyRecord) : undefined;
  }

  private liveElements(node: Node): AnyField[] | undefined {
    if (node instanceof Form) return undefined;
    return Array.isArray(node.value) ? node.elements : undefined;
  }

  private bound(target: object, key: PropertyKey, fn: unknown): unknown {
    let functions = this.boundFunctions.get(target);
    if (!functions) {
      functions = new Map();
      this.boundFunctions.set(target, functions);
    }
    const entry = functions.get(key);
    if (entry && entry.fn === fn) return entry.bound;
    const bound = (fn as (...args: unknown[]) => unknown).bind(target);
    functions.set(key, { fn, bound });
    return bound;
  }

  private fieldView(field: AnyField): AnyField {
    return this.cached(
      this.fieldViews,
      field,
      () =>
        new Proxy(field, {
          get: (target, key) => {
            if (key === 'value') return this.valueView(target);
            if (key === 'fields' && isObject(target.value)) {
              return this.fieldsView(target);
            }
            if (key === 'elements' && Array.isArray(target.value)) {
              return this.elementsView(target);
            }
            const value = Reflect.get(target, key, target);
            return typeof value === 'function'
              ? this.bound(target, key, value)
              : value;
          },
          set: (target, key, value) => Reflect.set(target, key, value, target),
        })
    );
  }

  private fieldsView(node: Node): AnyRecord | undefined {
    const live = this.liveFields(node);
    if (!live) return undefined;
    return this.cached(
      this.fieldsViews,
      node,
      () =>
        new Proxy(live, {
          get: (target, key) => {
            if (typeof key !== 'string') return Reflect.get(target, key);
            return this.fieldView(target[key] as AnyField);
          },
        })
    );
  }

  private elementsView(node: Node): AnyField[] {
    return this.cached(this.elementsViews, node, () =>
      (this.liveElements(node) ?? []).map((element) => this.fieldView(element))
    );
  }

  private valueView(node: Node): unknown {
    const value = this.liveValue(node);
    if (!Array.isArray(value) && !isObject(value)) return value;
    return this.cached(this.valueViews, node, () => {
      const state = this.states.get(node);
      return new Proxy(value as AnyRecord, {
        get: (target, key) => {
          const descriptor = Object.getOwnPropertyDescriptor(target, key);
          // A proxy must return the original value of a frozen property.
          const frozen =
            descriptor && !descriptor.configurable && !descriptor.writable;
          if (typeof key === 'string' && !frozen) {
            const child = Array.isArray(target)
              ? state?.elements?.[Number(key)]
              : state?.fields?.get(key);
            if (child && Object.is(target[key], child.value)) {
              return this.valueView(child);
            }
          }
          return Reflect.get(target, key);
        },
      });
    });
  }
}
