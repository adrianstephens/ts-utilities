# @isopodlabs/utilities
[![npm version](https://img.shields.io/npm/v/@isopodlabs/utilities.svg)](https://www.npmjs.com/package/@isopodlabs/utilities)
[![GitHub stars](https://img.shields.io/github/stars/adrianstephens/ts-utilities.svg?style=social)](https://github.com/adrianstephens/ts-utilities)
[![License](https://img.shields.io/npm/l/@isopodlabs/utilities.svg)](LICENSE.txt)

A comprehensive collection of TypeScript utilities for common programming tasks, including array/object manipulation, async operations, bit manipulation, string processing, and more.

##  Support My Work  
If you use this package, consider [buying me a cup of tea](https://coff.ee/adrianstephens) to support future updates!  

## Installation

```bash
npm install @isopodlabs/utilities
```

## Usage

```typescript
import * as utils from '@isopodlabs/utilities';
import { DeferredPromise, regex } from '@isopodlabs/utilities';
import * as glob from '@isopodlabs/utilities/glob';
import * as insensitive from '@isopodlabs/utilities/insensitive';
```

## Core Features

### Async Utilities (`async`)

Utilities for working with async operations on iterables:

```typescript
import { async } from '@isopodlabs/utilities';

// Parallel async map
const results = await async.map([1, 2, 3], async (n) => n * 2);

// Serial async map (one at a time)
const results = await async.mapSerial([1, 2, 3], async (n) => n * 2);

// Async reduce
const sum = await async.reduce([1, 2, 3], async (acc, n) => acc + n, 0);

// Async filter
const evens = await async.filter([1, 2, 3, 4], async (n) => n % 2 === 0);

// Async map object
const mapped = await async.mapObject(
{ a: 1, b: 2 },
async ([k, v]) => [k, v * 2]
);
```

### Array Utilities (`array`)

```typescript
import { array } from '@isopodlabs/utilities';

// Remove element from array
const arr = [1, 2, 3, 2];
array.remove(arr, 2); // returns true, arr is now [1, 3, 2]

// Compare arrays
array.compare([1, 2], [1, 3]); // returns -1

// Check equality
array.equal([1, 2, 3], [1, 2, 3]); // returns true

// Reverse in place
array.reverse(arr, 0, arr.length - 1);

// Rotate elements
array.rotate(arr, 0, arr.length, 1);

// Create array of instances
const instances = array.make(5, MyClass);

// Lazy slice generator
for (const item of array.lazySlice([1, 2, 3, 4, 5], 1, 4)) {
console.log(item);
}
```

### Algorithm Utilities

```typescript
import { partition, lowerBound, min, max, argmin, argmax } from '@isopodlabs/utilities';

// Partition by predicate
const { true: evens, false: odds } = partition([1, 2, 3, 4], n => n % 2 === 0);

// Binary search lower bound
const index = lowerBound([1, 2, 4, 5], 3);

// Find minimum/maximum
const minimum = min([3, 1, 4, 1, 5]);
const maximum = max([3, 1, 4, 1, 5]);

// Find index of min/max
const minIndex = argmin([3, 1, 4, 1, 5]);
const maxIndex = argmax([3, 1, 4, 1, 5]);
```

### Iterator Utilities

```typescript
import { map, filter, reduce, find, forEach } from '@isopodlabs/utilities';

// Map over any iterable
const doubled = map([1, 2, 3], n => n * 2);

// Filter iterable
const evens = filter([1, 2, 3, 4], n => n % 2 === 0);

// Reduce iterable
const sum = reduce([1, 2, 3], (acc, n) => acc + n, 0);

// Find first match
const first = find([1, 2, 3], n => n > 1); // returns 2

// ForEach with index
forEach([1, 2, 3], (n, i) => console.log(`${i}: ${n}`));
```

### Object Utilities

```typescript
import { obj } from '@isopodlabs/utilities';

// Map object values
const doubled = obj.map({ a: 1, b: 2 }, ([k, v]) => [k, v * 2]);

// Filter object entries
const filtered = obj.filter({ a: 1, b: 2, c: 3 }, ([k, v]) => v > 1);

// Deep merge objects
const merged = obj.merge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });

// Clone object with prototype
const copy = obj.clone(original);
```


### String Utilities

```typescript
import { replace, async_replace, splitFirstOf, splitLastOf, StringParser } from '@isopodlabs/utilities';

// Advanced replace with callback
const result = replace('hello world', /\w+/g, m => m[0].toUpperCase());

// Async replace
const result = await async_replace('hello world', /\w+/g, async m => m[0].toUpperCase());

// Split on first/last occurrence
const [before, after] = splitFirstOf('a.b.c', '.');
const [before, after] = splitLastOf('a.b.c', '.');

// String parser
const parser = new StringParser('hello world');
parser.skip('hello '); // returns true
parser.match(/\w+/); // returns 'world'
```

### Bit Manipulation (`bits`)

```typescript
import { bits } from '@isopodlabs/utilities';

// Find lowest set bit index
const index = bits.lowestSet32(0b1010); // returns 1

// Find highest set bit index
const index = bits.highestSet32(0b1010); // returns 4

// Count set bits
const count = bits.countSet32(0b1011); // returns 3

// Find nth set bit
const index = bits.nthSet32(0b10101, 2); // finds 3rd set bit

// Works with BigInt too
const high = bits.highestSet(12345678901234567890n);
const count = bits.countSet(12345678901234567890n);
```

### Glob Patterns (`glob`)

Convert glob patterns to regular expressions:

```typescript
import { glob } from '@isopodlabs/utilities';

// Parse glob to regex string
const pattern = glob.parse('src/**/*.ts');

// Create regex from glob
const re = glob.toRe('*.js');

// Multiple globs
const re = glob.toReMulti(['*.js', '*.ts']);
```

### Case-Insensitive Utilities (`insensitive`)

```typescript
import { insensitive } from '@isopodlabs/utilities';

// Case-insensitive string
const str = insensitive.String('Hello');
str.includes('HELLO'); // true

// Case-insensitive map
const map = new insensitive.Map([['Key', 'value']]);
map.get('key'); // 'value'
map.get('KEY'); // 'value'

// Case-insensitive set
const set = new insensitive.Set(['Hello', 'World']);
set.has('hello'); // true

// Case-insensitive record
const rec = insensitive.Record({ Name: 'John' });
rec['name']; // 'John'

// Preserve original case
const rec2 = insensitive.Record2({ Name: 'John' });
Object.keys(rec2); // ['Name']
```

### Additional Utilities

#### `Lazy`

```typescript
import { Lazy, CallCombiner, makeCache } from '@isopodlabs/utilities';

// Lazy evaluation
const lazy = new Lazy(() => expensiveComputation());
const value = lazy.value; // only computed once

// Combine rapid calls
const combiner = new CallCombiner(() => console.log('done'), 100);
combiner.trigger(); // will only call after 100ms of no triggers

```

#### `Simple cache`

```typescript
import { makeCache } from '@isopodlabs/utilities';

// Simple cache
const cache = makeCache(key => loadExpensiveData(key));
const data = cache.get('mykey');
cache.remove('mykey');
cache.clear();

// Set operations
const united = union(new Set([1, 2]), new Set([2, 3]));
const [remaining, removed] = difference(new Set([1, 2, 3]), new Set([2, 4]));
```

#### `DeferredPromise`

A promise that can be resolved/rejected externally:

```typescript
import { DeferredPromise } from '@isopodlabs/utilities';

const deferred = new DeferredPromise<number>();
deferred.then(value => console.log(value));

// Later...
deferred.resolve(42);

// Reset and reuse
deferred.reset();
```

#### Regex Template Tag

Create readable regular expressions:

```typescript
import { regex } from '@isopodlabs/utilities';

// Multi-line regex with comments
const re = regex`
\d+          # one or more digits
\.           # decimal point
\d{2}        # exactly 2 digits
`;

// With custom flags
const re = regex('i')`hello|world`;
```

#### Parallel/Serial Execution

```typescript
import { parallel, serial } from '@isopodlabs/utilities';

// Run functions in parallel
const results = await parallel(
() => fetchA(),
() => fetchB(),
() => fetchC()
);

// Run functions serially
const results = await serial(
() => fetchA(),
() => fetchB(),
() => fetchC()
);
```

## API Reference

### Exported Namespaces
- `obj` - Object utilities
- `glob` - Glob pattern utilities
- `bits` - Bit manipulation utilities
- `array` - Array utilities
- `async` - Async iterator utilities
- `insensitive` - Case-insensitive string/collection utilities

### Exported Functions
- Generic: `compare`, `reverse`, `union`, `difference`
- Algorithm: `partition`, `lowerBound`, `min`, `max`, `argmin`, `argmax`
- Iterator: `map`, `filter`, `reduce`, `find`, `forEach`
- Object: `map`, `filter`, `merge`, `clone`,
- String: `replace`, `async_replace`, `splitFirstOf`, `splitLastOf`, `trim0`, `previousChar`, `tag`
- Execution: `parallel`, `serial`
- Regex: `regex`, `reDup`

### Exported Classes
- `DeferredPromise` - Externally resolvable promise
- `Lazy` - Lazy evaluation wrapper
- `CallCombiner` - Debounce/combine rapid calls
- `StringParser` - String parsing helper

## License

This project is licensed under the MIT License.
