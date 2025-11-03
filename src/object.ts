
export function mapObject<T, U>(obj: Record<string, T>, func:(x:[k:string, v:T])=>[k:string, v:U]) : Record<string, U> {
	return Object.fromEntries(Object.entries(obj).map(x => func(x)));
}

export function filterObject<T>(obj: Record<string, T>, func:(x:[k:string, v:T])=>boolean) : Record<string, T> {
	return Object.fromEntries(Object.entries(obj).filter(x => func(x)));
}

export function merge(...list: Record<string, any>[]) {
	function isObject(value: any): value is Record<string, any> {
		return typeof value === 'object' && value !== null;
	}

	function recurse(target: Record<string, any>, source: Record<string, any>) {
		for (const key in source) {
			if (isObject(source[key]) && isObject(target[key]))
				recurse(target[key], source[key]);
			else
				target[key] = source[key];
		}
		return target;
	}
	
	return list.reduce((merged, r) => recurse(merged, r), {});
}

export function isEmpty(obj: object) : boolean {
	return Object.keys(obj).length === 0;
}

export function clone<T extends object>(obj: T) : T {
	return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}


export function compare<T>(a: T, b: T) : number {
	return a < b ? -1 : a > b ? 1 : 0;
}

export function reverse_compare<T>(a: T, b: T) : number {
	return compare(b, a);
}

export function reverse<T,R>(func: (a: T, b: T) => R) {
	return (a: T, b: T) => func(b, a);
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
		get: (fullpath: string) => {
			if (!cache[fullpath])
				cache[fullpath] = load(fullpath);
			return cache[fullpath];
		},
		remove: (fullpath: string) => delete cache[fullpath],
		clear:	() => Object.keys(cache).forEach(k => delete cache[k]),
	};
}

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

