# Disallow usage of optional-chaining (no-optional-chaining)

The [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) syntax was introduced in ES6. The generated code has bad performance and we need to prevent any further usage.

## Rule details

Example of **incorrect** code:

```js
const adventurer = {
  name: 'Alice',
  cat: {
    name: 'Dinah',
  },
};

const dogName = adventurer.dog?.name;
```

Example of **correct** code:

```js
const adventurer = {
  name: 'Alice',
  cat: {
    name: 'Dinah',
  },
};

const dogName =
  adventurer.dog === null || adventurer.dog === undefined ? undefined : adventurer.dog.name;
```
