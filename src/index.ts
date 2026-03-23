import * as async from './async';

export * from './iterator';
export * from './string';
export {lowerBound, argmin, min, argmax, max} from './array';
export {partition} from './iterator';

export * as obj from './obj';
export * as glob from './glob';
export * as bits from './bits';
export * as array from './array';
export * as async from './async';
export * as insensitive from './insensitive';

//-----------------------------------------------------------------------------
// handy generic functions
//-----------------------------------------------------------------------------

export function compare<T>(a: T, b: T) : number {
	return a < b ? -1 : a > b ? 1 : 0;
}

export function less<T>(a: T, b: T): boolean {
	return a < b;
}

export function reverse_compare<T>(a: T, b: T) : number {
	return compare(b, a);
}

export function reverse<T,R>(func: (a: T, b: T) => R) {
	return (a: T, b: T) => func(b, a);
}

export async function parallel(...fns: (()=>any)[]): Promise<any[]> {
	return async.map(fns, f => f());
}

export async function serial(...fns: (()=>any)[]): Promise<any[]> {
	return async.mapSerial(fns, f => f());
}

//-----------------------------------------------------------------------------
// set helpers
//-----------------------------------------------------------------------------

export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
	return new Set([...a, ...b]);
}

export function difference<T>(a: Set<T>, b: Set<T>): [Set<T>, Set<T>] {
	const remaining = new Set(a);
	const removed	= new Set<T>();
	for (const item of b) {
		if (remaining.delete(item))
			removed.add(item);
	}
	return [remaining, removed];
}

//-----------------------------------------------------------------------------
// regex functions
//-----------------------------------------------------------------------------
/*
export function regex(strings: TemplateStringsArray, ...args: any[]): RegExp {
	const s = strings.raw.reduce((s, str, i) => s + str + (args[i] || ''), '');
	const lines = s.split('\n');
	return new RegExp(lines.map(line => line.split('#')[0].trim()).join(''), 'g');
}
*/
export function regex(strings: TemplateStringsArray, ...args: any[]): RegExp
export function regex(flags: string): (strings: TemplateStringsArray, ...args: any[]) => RegExp
export function regex(param: TemplateStringsArray|string, ...args: any[]) {
	const flags = typeof param === 'string' ? param : 'g';
	if (typeof param === 'string')
		return inner;
	return inner(param, ...args);

	function inner(strings: TemplateStringsArray, ...args: any[]): RegExp {
		const s = strings.raw.reduce((s, str, i) => s + str + (args[i] || ''), '');
		const lines = s.split('\n');
		return new RegExp(lines.map(line => line.split('#')[0].trim()).join(''), flags);
	};
}

export function reDup(re: RegExp) { return new RegExp(re.source, re.flags); }

//-----------------------------------------------------------------------------
// handy classes and functions
//-----------------------------------------------------------------------------

export class DeferredPromise<T> {
	private promise:	Promise<T>;
	private resolver?:	(value: T) => void;
	private rejecter?:	(reason?: any) => void;

	constructor(t?: T) {
		this.promise = t === undefined ? new Promise<T>((resolve, reject) => {
			this.resolver = resolve;
			this.rejecter = reject;
		}) : Promise.resolve(t);
	}
	resolve(value: T) {
		if (this.resolver) {
			this.resolver(value);
			this.resolver = undefined;
		}
	}
	reset() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolver = resolve;
			this.rejecter = reject;
		});
	}
	then<T2 = void>(onfulfilled?: (t: T) => T2 | PromiseLike<T2>): Promise<T2> {
		return this.promise.then(onfulfilled);
	}
	reject(error: any) {
		if (this.rejecter)
			this.rejecter(error);
	}
}


export class Lazy<T> {
	private _value: T | undefined;
	constructor(private factory: () => T) {}
	get value() {
		if (this._value === undefined)
			this._value = this.factory();
		return this._value;
	}
	// Add 'then' method only when T is a Promise
	then<U>(this: T extends Promise<infer _R> ? Lazy<T> : never, onFulfilled: (value: T extends Promise<infer R> ? R : never) => U): Promise<U> {
		return (this.value as any).then(onFulfilled);
	}
}

export function Memoize<T>(func: () => T) {
	const lazy = new Lazy(func);
	return () => lazy.value;
}

export class CallCombiner0 {
	private timeout?: ReturnType<typeof setTimeout>;

	combine(delay: number, func: ()=>void) {
		if (this.timeout)
			clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.timeout = undefined;
			func();
		}, delay);
	}
	pending() : boolean {
		return !!this.timeout;
	}
}
export class CallCombiner extends CallCombiner0 {
	constructor(private func: ()=>void, private delay: number) {
		super();
	}
	trigger() {
		super.combine(this.delay, this.func);
	}
}

export function makeCache<T>(load: (key: string)=>T) {
	const cache: Record<string, T> = {};
	return {
		get: 	(key: string) => {
			if (!cache[key])
				cache[key] = load(key);
			return cache[key];
		},
		remove: (key: string) => delete cache[key],
		clear:	() => Object.keys(cache).forEach(k => delete cache[k]),
	};
}
