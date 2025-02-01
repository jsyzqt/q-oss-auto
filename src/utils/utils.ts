export const checkEmpty = (obj: any) => {

    for (let key in obj) {
        //if the value is 'object'
        if (obj[key] instanceof Object === true) {
            if (checkEmpty(obj[key]) === false) return false;
        }
        //if value is string/number
        else {
            //if array or string have length is not 0.
            if (obj[key].length !== 0) return false;
        }
    }
    return true;
}

export const trimPath = (str: string) => {
    return str.startsWith('/') ? str.slice(1, str.length) : str;
}