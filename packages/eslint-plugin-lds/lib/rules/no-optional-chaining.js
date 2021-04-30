/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: 'disallow usage of optional chaining',
            category: 'LDS',
            url: 'https://sfdc.co/lds-no-optional-chaining'
        },
        schema: [],
    },

    create(context) {
        return {
            OptionalMemberExpression: function(node) {
                if (node.optional === true) {
                    context.report({
                        node,
                        message: 'Optional chaining isn\'t allowed.',
                    });
                }
            }
        };
    },
};