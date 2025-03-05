# SequentialRequest - Typescript Utility for Sequential Task Execution

## Overview

`SequentialRequest` is a Typescript utility that allows you to handle a sequence of tasks(function or promise) in a defined order with support for error handling.

## Features

- **Chained Task Execution**: Tasks can be chained sequentially, where each task is executed after the previous one.
- **Error Handling**: Each task can have its own custom error handler, and the final promise guarantees that errors can be handled gracefully.
- **Foreach Support**: You can iterate over arrays or resolved array values and execute a task for each item in the array.
- **Default Guaranteed Error Handling**: You can provide a default error handler for tasks that may not have their own error handler.

## Installation

```bash
npm install sequential-request
```

## Usage

### Create a Sequential Request Instance

```typescript
import { SequentialRequest } from "sequential-request";

const request = new SequentialRequest();
```

You can also pass a default error handler to the constructor:

```typescript
const requestWithErrorHandler = new SequentialRequest((error) => {
  return {
    message: "Default Error Handler",
    error,
  };
});
```

### Adding Tasks

You can chain tasks using the `next` method. Tasks can be functions that return a promise or a direct promise value.

```typescript
request
  .next(Promise.resolve("Task 1"))
  .next((prevResult) => Promise.resolve("Task 2"));
```

### Handling Errors

You can catch errors at any point in the sequence by chaining the `catch` method:

```typescript
request
  .next(Promise.resolve("Task 1"))
  .next((prevResult) => Promise.resolve("Task 2"))
  .catch((error) => ({
    message: "Task 2 Error Handler",
    error,
  }));
```

### Foreach Loop

You can iterate over arrays of items and process them sequentially using the `foreach` method.

```typescript
request
  .next(Promise.resolve("Task 1"))
  .next((prevResult) => Promise.resolve("Task 2"))
  .catch((error) => ({
    message: "Task 2 Error Handler",
    error,
  }))
  .foreach([1, 2, 3], (item) => Promise.resolve(item));
```

### Ending the Sequence

Finally, the `end` method allows you to specify a callback that is called with all the results of the sequential tasks:

```typescript
request
  .next(Promise.resolve("Task 1"))
  .next((prevResult) => Promise.resolve("Task 2"))
  .catch((error) => ({
    message: "Task 2 Error Handler",
    error,
  }))
  .foreach([1, 2, 3], (item) => Promise.resolve(item))
  .end(([res1, res2, res3]) => ({
    result1: res1,
    result2: res2,
    result3: res3,
  }));
```

### Guaranteed Error Handling

You can guarantee an error handler for the entire request:

```typescript
request
  .next(Promise.resolve("Task 1"))
  .next((prevResult) => Promise.resolve("Task 2"))
  .catch((error) => ({
    message: "Task 2 Error Handler",
    error,
  }))
  .foreach([1, 2, 3], (item) => Promise.resolve(item))
  .end(([res1, res2, res3]) => ({
    result1: res1,
    result2: res2,
    result3: res3,
  }))
  .guarantee((error) => ({
    message: "Guaranteed Error Handler",
    error,
  }));
```

You can also use the default guaranteed error handler:

```typescript
guarantee("DEFAULT");
```

## License

MIT License
