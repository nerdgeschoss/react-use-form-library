import { Field, MappedFields } from '../field';

type AssertEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <
  T
>() => T extends B ? 1 : 2
  ? true
  : never;

describe('MappedFields', () => {
  it('treats tuples as scalar Field, not FieldSet', () => {
    type _Tuple = AssertEqual<
      MappedFields<{ range: [Date, Date] }>['range'],
      Field<[Date, Date]>
    >;
    const _tuple: _Tuple = true;

    type _NullableTuple = AssertEqual<
      MappedFields<{ range: [Date, Date] | null }>['range'],
      Field<[Date, Date] | null>
    >;
    const _nullableTuple: _NullableTuple = true;

    type _TupleHasNoAdd = MappedFields<{
      range: [Date, Date];
    }>['range'] extends { add: (element: unknown) => void }
      ? never
      : true;
    const _tupleHasNoAdd: _TupleHasNoAdd = true;

    expect([_tuple, _nullableTuple, _tupleHasNoAdd]).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('treats variable-length arrays as FieldSet', () => {
    type ArrField = MappedFields<{ dates: Date[] }>['dates'];

    type _Value = AssertEqual<ArrField['value'], Date[]>;
    const _value: _Value = true;

    type _HasFieldSetShape = ArrField extends {
      elements: unknown[];
      add: (element: Date) => void;
    }
      ? true
      : never;
    const _hasFieldSetShape: _HasFieldSetShape = true;

    expect([_value, _hasFieldSetShape]).toEqual([true, true]);
  });
});
