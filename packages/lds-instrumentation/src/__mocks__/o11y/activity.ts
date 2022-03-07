import type { Activity, Schema, SchematizedData } from 'o11y/client';

function stop(_userSchemaOrText?: Schema | string, _userData?: SchematizedData) {}
function error(_error: Error, _userSchemaOrText?: Schema | string, _userData?: SchematizedData) {}
function discard() {}
function terminate() {}

export const activity: Activity = {
    stop,
    error,
    discard,
    terminate,
};
