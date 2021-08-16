# Restrict usage of TODO comments without a GUS Work Id or Git Issue # (no-invalid-todo)

## Rule details

This eslint rule checks that all the TODO comments contain both a reference to a git issue or a GUS work Id and a comment describing the TODO.

Example of **incorrect** TODO comments:

```js
// TODO: This is a TODO without a GUS Work Id or Git Issue #

// TODO [W-123456]:
```

Example of **correct** TODO comments:

```js
// TODO [#1234]: This is a todo

// TODO [salesforce/lds-lightning-platform#1234]: This is a todo

// TODO [W-123456]: this is a todo

// TODO [TD-123456]: this is a todo waiting on a TD
```
