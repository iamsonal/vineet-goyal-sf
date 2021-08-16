/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';

const TODO_REGEX = /\*?\s+(TODO|todo)/;
const VALID_TODO_REGEX = /\*?\s+(TODO|todo) \[((#\d+)|(\S+\/\S+#\d+)|(W-\d+)|(TD-\d+))\]:\s+[\w\d]+/;

/**
 * This eslint rule checks that all the TODO comments contain both a reference to a git issue or a GUS work Id + a comment
 *
 * Valid comment formats:
 *   - `// TODO [#1234]: This is a todo`
 *   - `// TODO [salesforce/lds-lightning-platform#1234]: This is a todo`
 *   - `// TODO [W-123456]: this is a todo`
 *   - `// TODO [TD-123456]: this is a todo waiting on a TD`
 */

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: 'no TODOs allowed without a GUS Work Id OR Git Issue #',
            category: 'LDS',
            url: 'https://sfdc.co/lds-no-invalid-todo'
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        function checkComment(comment) {
            const { value } = comment;

            const isTodo = value.match(TODO_REGEX);
            const isValidTodo = value.match(VALID_TODO_REGEX);

            if (isTodo && !isValidTodo) {
                context.report({
                    node: comment,
                    message:
                        'Invalid TODO comment format, the GUS Work Id OR Git issue reference is probably missing. Correct TODO format,\n// TODO [<GUS or Git Id>]: <comment>',
                });
            }
        }

        return {
            Program() {
                const comments = sourceCode.getAllComments();

                for (const comment of comments) {
                    checkComment(comment);
                }
            },
        };
    },
};