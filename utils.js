'use strict'

const globals = require('./globals');

module.exports = {
    getCodeFromName: (name) => {
        const index = globals.teams.findIndex((el) => el === name),
            code = globals.teamCodes[index];
        return code;
    },
    arrayUnique: (array) => {
        console.log(array.length);
        if (array.length) {
            var a = array.concat();
            for (var i = 0; i < a.length; ++i) {
                for (var j = i + 1; j < a.length; ++j) {
                    if (a[i] === a[j])
                        a.splice(j--, 1);
                }
            }
            return a;
        } else {
            return array;
        }

    }
}