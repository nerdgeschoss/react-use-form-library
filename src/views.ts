import { FieldImplementation, MappedFields } from './field';
import { Form } from './form';
import { isObject } from './util';

type AnyField = FieldImplementation<unknown, unknown>;
type AnyForm = Form<unknown>;
type Node = AnyField | AnyForm;
type AnyRecord = Record<PropertyKey, unknown>;

interface NodeState {
  // Changes with anything observable on the node or below it.
  version: number;
  // Changes only with the value: the value itself, its keys and its children's values.
  valueVersion: number;
  signature: unknown[];
  valueSignature: unknown[];
}

interface Cached<V> {
  version: number;
  view: V;
  source?: unknown;
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

// Wrapper → real object. Shared by all forms, so a wrapper of one form is unwrapped by another.
const targets = new WeakMap<object, object>();

/** Replaces wrappers with their real objects, also inside plain objects and arrays. */
export function unwrap(
  value: unknown,
  seen = new Map<object, unknown>()
): unknown {
  if (!value || typeof value !== 'object') return value;
  const target = targets.get(value);
  if (target) return target;
  if (!Array.isArray(value) && !isObject(value)) return value;
  if (seen.has(value)) return seen.get(value);
  seen.set(value, value);
  let copy: AnyRecord | undefined;
  for (const key of Object.keys(value)) {
    const inner = (value as AnyRecord)[key];
    const unwrapped = unwrap(inner, seen);
    if (unwrapped !== inner) {
      copy ??= (Array.isArray(value) ? [...value] : { ...value }) as AnyRecord;
      copy[key] = unwrapped;
    }
  }
  const result = copy ?? value;
  seen.set(value, result);
  return result;
}

function sameSignature(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

// A loop instead of `push(...values)`, which overflows the stack on large field sets.
function pushAll(target: unknown[], values: Iterable<unknown>): void {
  for (const value of values) target.push(value);
}

function isFrozenProperty(target: object, key: PropertyKey): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  return !!descriptor && !descriptor.configurable && !descriptor.writable;
}

function unwrapDescriptor(descriptor: PropertyDescriptor): PropertyDescriptor {
  return 'value' in descriptor
    ? { ...descriptor, value: unwrap(descriptor.value) }
    : descriptor;
}

/**
 * Gives `useForm({ memoize: true })` results a new identity whenever their
 * content changes, so memoizing consumers (e.g. the React Compiler) see every
 * change. The results are proxies over the live fields and model: reads and
 * writes behave as on the live objects, only the identity follows the content.
 */
export class FormViews<T> {
  private states = new WeakMap<Node, NodeState>();
  private fieldViews = new WeakMap<Node, Cached<AnyField>>();
  private fieldsViews = new WeakMap<Node, Cached<AnyRecord>>();
  private elementsViews = new WeakMap<Node, Cached<AnyField[]>>();
  private valueViews = new WeakMap<Node, Cached<unknown>>();
  // Nested objects that no field holds yet; they only change through direct writes.
  private rawViews = new WeakMap<object, object>();
  private functions = new WeakMap<
    object,
    Map<PropertyKey, [unknown, unknown]>
  >();
  private formValues = new WeakMap<
    AnyForm,
    Cached<Pick<FormSnapshot<T>, 'changes' | 'touchedValues'>>
  >();
  private formMethods = new WeakMap<AnyForm, FormMethods<T>>();

  read(form: Form<T>): FormSnapshot<T> {
    const node = form as AnyForm;
    const { version } = this.visit(node);
    let values = this.formValues.get(node);
    if (!values || values.version !== version) {
      values = { version, view: this.buildFormValues(node) };
      this.formValues.set(node, values);
    }
    return {
      model: this.valueView(node) as T,
      fields: this.fieldsView(
        node,
        node.fields as AnyRecord
      ) as MappedFields<T>,
      ...values.view,
    };
  }

  methods(form: Form<T>): FormMethods<T> {
    let methods = this.formMethods.get(form as AnyForm);
    if (!methods) {
      methods = {
        updateFields: (model) => form.updateFields(unwrap(model) as Partial<T>),
        onSubmit: form.submit.bind(form),
        reset: form.reset.bind(form),
        resetError: form.resetError.bind(form),
      };
      this.formMethods.set(form as AnyForm, methods);
    }
    return methods;
  }

  // The same keys as `form.changes` and `form.touchedValues`, with the values as views.
  // Frozen, because they are shared by all renders until something changes.
  private buildFormValues(
    form: AnyForm
  ): Pick<FormSnapshot<T>, 'changes' | 'touchedValues'> {
    const changes: AnyRecord = {};
    const touchedValues: AnyRecord = {};
    const fields = form.fields as AnyRecord;
    for (const key in fields) {
      const field = fields[key] as AnyField;
      if (field.dirty) changes[key] = this.valueView(field);
      if (field.touched) touchedValues[key] = this.valueView(field);
    }
    return {
      changes: Object.freeze(changes),
      touchedValues: Object.freeze(touchedValues),
    } as Pick<FormSnapshot<T>, 'changes' | 'touchedValues'>;
  }

  private visit(node: Node): NodeState {
    const fields = this.liveFields(node);
    const children: AnyField[] = [];
    const keys: string[] = [];
    if (fields) {
      for (const key of Object.keys(fields)) {
        keys.push(key);
        children.push(fields[key] as AnyField);
      }
    }
    // `forEach` skips the holes of sparse arrays.
    this.liveElements(node)?.forEach((element) => children.push(element));
    const childStates = children.map((child) => this.visit(child));

    // The value's own entries, so a slot written by any path is noticed, plus the children's value versions.
    const value = this.liveValue(node);
    const valueSignature: unknown[] = [value];
    if (Array.isArray(value) || isObject(value)) {
      for (const key of Object.keys(value as object)) {
        valueSignature.push(key, (value as AnyRecord)[key]);
      }
    }
    childStates.forEach((state) => valueSignature.push(state.valueVersion));

    const signature: unknown[] = [];
    pushAll(signature, keys);
    pushAll(signature, children);
    if (!(node instanceof Form)) {
      signature.push(
        node.touched,
        node.focused,
        node.required,
        node.valid,
        node.dirty
      );
      const errors: unknown = node.errors;
      if (Array.isArray(errors)) {
        signature.push(errors.length);
        pushAll(signature, errors);
      } else {
        signature.push(errors);
      }
    }
    childStates.forEach((state) => signature.push(state.version));

    const previous = this.states.get(node);
    let state: NodeState;
    if (!previous) {
      state = { version: 0, valueVersion: 0, signature, valueSignature };
    } else {
      const valueChanged = !sameSignature(
        previous.valueSignature,
        valueSignature
      );
      const changed =
        valueChanged || !sameSignature(previous.signature, signature);
      state = {
        version: previous.version + (changed ? 1 : 0),
        valueVersion: previous.valueVersion + (valueChanged ? 1 : 0),
        signature,
        valueSignature,
      };
    }
    this.states.set(node, state);
    return state;
  }

  private state(node: Node): NodeState {
    return this.states.get(node) ?? this.visit(node);
  }

  private cached<V>(
    cache: WeakMap<Node, Cached<V>>,
    node: Node,
    version: number,
    create: () => V,
    source?: unknown
  ): V {
    const entry = cache.get(node);
    if (entry && entry.version === version && entry.source === source) {
      return entry.view;
    }
    const view = create();
    cache.set(node, { version, view, source });
    return view;
  }

  private liveValue(node: Node): unknown {
    return node instanceof Form ? node.model : node.value;
  }

  // `field.fields` replaces a falsy value with `{}`, so the walk only reads it for object values.
  private liveFields(node: Node): AnyRecord | undefined {
    if (node instanceof Form) return node.fields as AnyRecord;
    return isObject(node.value) ? (node.fields as AnyRecord) : undefined;
  }

  private liveElements(node: Node): AnyField[] | undefined {
    if (node instanceof Form) return undefined;
    return Array.isArray(node.value) ? node.elements : undefined;
  }

  // The subfield or element holding `key` of the node's value, without creating one.
  private child(node: Node, key: string): AnyField | undefined {
    const value = this.liveValue(node);
    if (Array.isArray(value)) {
      if (node instanceof Form) return undefined;
      const element = node.elements[Number(key)];
      return element instanceof FieldImplementation ? element : undefined;
    }
    const fields = this.liveFields(node);
    if (!fields || !Object.prototype.hasOwnProperty.call(fields, key)) {
      return undefined;
    }
    const field = fields[key];
    return field instanceof FieldImplementation
      ? (field as AnyField)
      : undefined;
  }

  private stableFunction(
    target: object,
    key: PropertyKey,
    fn: unknown
  ): unknown {
    let functions = this.functions.get(target);
    if (!functions) {
      functions = new Map();
      this.functions.set(target, functions);
    }
    const entry = functions.get(key);
    if (entry && entry[0] === fn) return entry[1];
    const stable = (...args: unknown[]): unknown =>
      (fn as (...args: unknown[]) => unknown).apply(
        target,
        args.map((arg) => unwrap(arg))
      );
    functions.set(key, [fn, stable]);
    return stable;
  }

  private fieldView(field: AnyField): AnyField {
    return this.cached(
      this.fieldViews,
      field,
      this.state(field).version,
      () => {
        const view: AnyField = new Proxy(field, {
          get: (target, key) => {
            if (key === 'value') return this.valueView(target);
            if (key === 'fields') {
              // Reading `fields` keeps the live getter's behaviour, including on leaf fields.
              return this.fieldsView(
                target,
                Reflect.get(target, key, target) as AnyRecord
              );
            }
            if (key === 'elements') return this.elementsView(target);
            // Getters run on the real field: its private fields don't work with a proxy as `this`.
            const value = Reflect.get(target, key, target);
            return typeof value === 'function' && key !== 'constructor'
              ? this.stableFunction(target, key, value)
              : value;
          },
          set: (target, key, value, receiver) =>
            receiver === view
              ? Reflect.set(target, key, unwrap(value), target)
              : Reflect.set(target, key, value, receiver),
          defineProperty: (target, key, descriptor) =>
            Reflect.defineProperty(target, key, unwrapDescriptor(descriptor)),
        });
        targets.set(view, field);
        return view;
      }
    );
  }

  private fieldsView(node: Node, live: AnyRecord): AnyRecord {
    return this.cached(
      this.fieldsViews,
      node,
      this.state(node).version,
      () =>
        new Proxy(live, {
          get: (target, key) => {
            if (typeof key !== 'string') return Reflect.get(target, key);
            // Inherited keys (`constructor`, `hasOwnProperty`, ...) are not fields.
            const field = target[key];
            return field instanceof FieldImplementation
              ? this.fieldView(field as AnyField)
              : field;
          },
        })
    );
  }

  // A proxy over the live array, so `add` and `remove` are visible right away.
  private elementsView(field: AnyField): AnyField[] {
    const elements = field.elements;
    return this.cached(
      this.elementsViews,
      field,
      this.state(field).version,
      () => {
        const view = new Proxy(elements, {
          get: (target, key) => {
            const value = Reflect.get(target, key);
            return value instanceof FieldImplementation
              ? this.fieldView(value as AnyField)
              : value;
          },
        });
        targets.set(view, elements);
        return view;
      },
      elements
    );
  }

  private valueView(node: Node): unknown {
    const value = this.liveValue(node);
    if (!Array.isArray(value) && !isObject(value)) return value;
    return this.cached(
      this.valueViews,
      node,
      this.state(node).valueVersion,
      () =>
        this.wrapValue(value as AnyRecord, (key, raw) => {
          const child = this.child(node, key);
          return child && Object.is(raw, child.value)
            ? this.valueView(child)
            : this.rawView(raw);
        }),
      value
    );
  }

  private rawView(value: unknown): unknown {
    if (!Array.isArray(value) && !isObject(value)) return value;
    let view = this.rawViews.get(value as object);
    if (!view) {
      view = this.wrapValue(value as AnyRecord, (_key, raw) =>
        this.rawView(raw)
      );
      this.rawViews.set(value as object, view);
    }
    return view;
  }

  private wrapValue(
    value: AnyRecord,
    wrapChild: (key: string, raw: unknown) => unknown
  ): object {
    const view: AnyRecord = new Proxy(value, {
      get: (target, key) => {
        const raw = Reflect.get(target, key);
        // A proxy must return the original value of a frozen property.
        if (typeof key !== 'string' || isFrozenProperty(target, key))
          return raw;
        return wrapChild(key, raw);
      },
      set: (target, key, newValue, receiver) =>
        receiver === view
          ? Reflect.set(target, key, unwrap(newValue))
          : Reflect.set(target, key, newValue, receiver),
      defineProperty: (target, key, descriptor) =>
        Reflect.defineProperty(target, key, unwrapDescriptor(descriptor)),
    });
    targets.set(view, value);
    return view;
  }
}
