/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';

const rules = {
    'no-optional-chaining': require('./rules/no-optional-chaining'),
    'no-invalid-todo': require('./rules/no-invalid-todo'),
    'no-error-in-production': require('./rules/no-error-in-production'),
};

module.exports = {
    rules,
};
