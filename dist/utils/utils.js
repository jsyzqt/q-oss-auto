"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimPath = exports.checkEmpty = void 0;
const checkEmpty = (obj) => {
    for (let key in obj) {
        //if the value is 'object'
        if (obj[key] instanceof Object === true) {
            if ((0, exports.checkEmpty)(obj[key]) === false)
                return false;
        }
        //if value is string/number
        else {
            //if array or string have length is not 0.
            if (obj[key].length !== 0)
                return false;
        }
    }
    return true;
};
exports.checkEmpty = checkEmpty;
const trimPath = (str) => {
    return str.startsWith('/') ? str.slice(1, str.length) : str;
};
exports.trimPath = trimPath;
//# sourceMappingURL=utils.js.map