/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';

const rule = require("../no-optional-chaining");
const RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();

ruleTester.run("no-optional-chaining", rule, {
    valid: [
        {
            code: "var foo = bar.value;"
        },
        {
            code: "if (foo.bar.value == 'some_value') { test = foo.bar.value; }"
        }
    ],

    invalid: [
        {
            code: "var foo = bar?.value;",
            errors: 1
        },
        {
            code: "if (foo?.bar.value == 'some_value') { test = foo.bar.value; }",
            errors: 1
        }
    ]
});