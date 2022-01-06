/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';


const rule = require("../no-error-in-production");
const { RuleTester } = require("eslint");
const dedent = require('dedent-js');

const ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser')
});

ruleTester.run("no-error-in-production", rule, {
    valid: [
        "if (process.env.NODE_ENV !== 'production') { throw new Error('this is an error'); }",
        "if ('production' !== process.env.NODE_ENV) { throw new Error('this is an error'); }",
        "if (process.env.NODE_ENV !== 'production') { if (errors.length > 0) { throw new Error('this is an error'); } }"
    ],

    invalid: [
        {
            code: "throw new Error('this is an error');",
            errors: 1,
            output: dedent`
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('this is an error');
                }
            `
        },
        {
            code: dedent`
                if (errors.length > 0) {
                    throw new Error('this is an error');
                }
            `,
            output: dedent`
                if (errors.length > 0) {
                    if (process.env.NODE_ENV !== 'production') {
                        throw new Error('this is an error');
                    }
                }
            `,
            errors: 1
        }
    ]
});