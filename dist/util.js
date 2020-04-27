import { useState } from 'react';
export function useForceUpdate() {
    var _a = useState(true), updateState = _a[1];
    return function () {
        updateState(function (state) { return !state; });
    };
}
//# sourceMappingURL=util.js.map