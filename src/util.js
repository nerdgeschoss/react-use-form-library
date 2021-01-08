"use strict";
exports.__esModule = true;
exports.useForceUpdate = void 0;
var react_1 = require("react");
function useForceUpdate() {
    var _a = react_1.useState(true), updateState = _a[1];
    return function () {
        updateState(function (state) { return !state; });
    };
}
exports.useForceUpdate = useForceUpdate;
