import { Activity, MetricsTags, Schema, SchematizedData } from 'o11y/client';
import { activity } from './activity';

function log(_schema: Schema, _data?: SchematizedData) {}
function error(_err: Error, _userSchemaOrText?: string, _data?: SchematizedData) {}
function startActivity(_name: string): Activity {
    return activity;
}
function incrementCounter(
    _operation: string,
    _increment?: number,
    _hasError?: boolean,
    _tags?: MetricsTags
) {}
function trackValue(_operation: string, _value: number, _hasError?: boolean, _tags?: MetricsTags) {}

export const instrumentation = {
    log,
    error,
    startActivity,
    incrementCounter,
    trackValue,
};
