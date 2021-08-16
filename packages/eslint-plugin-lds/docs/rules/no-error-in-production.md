# Stop Errors being thrown in production code # (no-errors-in-production)

## Rule details

This eslint rule checks that all errors being thrown are guarded by a production check.

Example of **incorrect** code:

```js
throw new Error('this is an error');

if (errors.length > 0) {
  throw new Error('this is an error');
}
```

Example of **correct** TODO comments:

```js
if (process.env.NODE_ENV !== 'production') {
  throw new Error('this is an error');
}

if ('production' !== process.env.NODE_ENV) {
  throw new Error('this is an error');
}

if (process.env.NODE_ENV !== 'production') {
  if (errors.length > 0) {
    throw new Error('this is an error');
  }
}
```
