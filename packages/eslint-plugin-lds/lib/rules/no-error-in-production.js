/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
'use strict';
const dedent = require('dedent-js');

/*
 * This eslint rule checks that all Errors being thrown in lds code do so inside a prod check like so,
 *
 *  if (process.env.NODE_ENV !== 'production') {
 *       throw new Error('Can only extract apiName from record post request');
 *  }
 */

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: 'no Errors should be thrown without a prod check',
            category: 'LDS',
            url: 'https://sfdc.co/lds-no-error-in-production'
        },
        schema: [],
        fixable: 'code'
    },

    create(context) {
        const sourceCode = context.getSourceCode();

        function addProductionCheck(node) {
            const startIndex = node.loc.start.column;
            const fixed = dedent`
                if (process.env.NODE_ENV !== 'production') {
                    ${sourceCode.getText(node)}
                }
            `;

            return fixed.split('\n').map((line, index) => {
                // the first line will have the original indent
                if (index === 0) {
                    return line;
                }
                return `${' '.repeat(startIndex)}${line}`;
            }).join('\n');
        }

        function isValidProductionCheck(testNode) {
            if (testNode.operator !== '!==') {
                return false;
            }

            if ((isValidProductionLiteral(testNode.left) && isValidProcessEnvNodeExpression(testNode.right)) ||
                (isValidProductionLiteral(testNode.right) && isValidProcessEnvNodeExpression(testNode.left))) {
                return true;
            }
            return false;
        }

        function isValidProductionLiteral(literalNode) {
            if (literalNode.type === 'Literal' && literalNode.value === 'production') {
                return true;
            }
            return false;
        }

        function isValidProcessEnvNodeExpression(expressionNode) {
            if (expressionNode.type === 'MemberExpression' && sourceCode.getText(expressionNode) === 'process.env.NODE_ENV') {
                return true;
            }
            return false;
        }

        return {
            ThrowStatement(node) {
                const isThrowNewError = node.argument && node.argument.type === 'NewExpression' && node.argument.callee && node.argument.callee.name === 'Error';

                if (isThrowNewError) {
                    const isGuarded = context.getAncestors().some((ancestor) => {
                        return (
                            ancestor.type === 'IfStatement' &&
                            isValidProductionCheck(ancestor.test)
                        );
                    });

                    if (!isGuarded) {
                        context.report({
                            node,
                            message: 'Unexpected \'throw new Error(...\' statement not guarded by a production check.',
                            fix: function(fixer) {
                                return fixer.replaceText(node, addProductionCheck(node));
                            }
                        });
                    }
                }
            }
        };
    },
};