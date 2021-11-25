const regEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isEmail(str: string) {
    return regEmail.test(str);
}

const regPassword = /^\S*(?=\S{6,})(?=\S*\d)(?=\S*[a-zA-Z])\S*$/;
export function isPassword(str: string) {
    return regPassword.test(str);
}
