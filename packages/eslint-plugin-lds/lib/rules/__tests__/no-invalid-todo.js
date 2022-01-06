/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';

const rule = require("../no-invalid-todo");
const { RuleTester } = require("eslint");

const ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser')
});

ruleTester.run("no-invalid-todo", rule, {
    valid: [
        {
            code: "// TODO [#1234]: This is a todo"
        },
        {
            code: "// TODO [salesforce/lds-lightning-platform#1234]: This is a todo"
        },
        {
            code: "// TODO [W-123456]: this is a todo"
        },
        {
            code: "// TODO [TD-123456]: this is a todo waiting on a TD"
        }
    ],

    invalid: [
        {
            code: "// TODO: This is a TODO without a GUS Work Id or Git Issue #",
            errors: 1
        },
        {
            code: "// TODO [W-123456]:   ",
            errors: 1
        }
    ]
});