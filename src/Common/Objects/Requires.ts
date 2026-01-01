import { ObjKey } from "@/Common/Objects/Common";
import { TypeClass, TypeObject } from "@/Common/Objects/TypeObject";

export class Requires {
  private _requireAll: ObjKey[] = [];
  private _requireAny: ObjKey[][] = [];
  private _allTypes: ObjKey[] = [];

  constructor(requires: ObjKey[] | ObjKey[][] = []) {
    for (const r of requires) {
      if (Array.isArray(r)) {
        this._requireAny.add(r);
        this._allTypes.add(...r);
      } else {
        this._requireAll.add(r);
        this._allTypes.add(r);
      }
    }
  }

  get allTypes(): ObjKey[] {
    return this._allTypes;
  }

  get isEmpty(): boolean {
    return this._allTypes.size === 0;
  }

  get requireAll(): ObjKey[] {
    return this._requireAll;
  }

  get requireAny(): ObjKey[][] {
    return this._requireAny;
  }

  isSatisfied(types: Set<TypeObject>): boolean {
    // Need to check type.key, type.category && type.concept

    // At least one of the given objects must match each "require all"-keys
    for (const require of this._requireAll) {
      if (!types.some((t) => t.key === require || t.category === require || t.concept === require))
        return false;
    }

    // At least one of the given objects must match any "require any"-key
    for (const require of this._requireAny) {
      if (
        !types.some(
          (t) =>
            require.has(t.key) || (t.category && require.has(t.category)) || require.has(t.concept),
        )
      )
        return false;
    }

    // Both checks pass
    return true;
  }

  filter(classes: TypeClass[]): Requires {
    const all: ObjKey[] = [];
    const any: ObjKey[][] = [];

    for (const req of this._requireAll) {
      if (classes.some((c) => req.startsWith(`${c}:`))) {
        all.add(req);
      }
    }

    for (const reqAny of this._requireAny) {
      for (const req of reqAny) {
        if (classes.some((c) => req.startsWith(`${c}:`))) {
          any.add(reqAny);
          break;
        }
      }
    }

    return new Requires([...all, ...any] as ObjKey[] | ObjKey[][]);
  }
}
