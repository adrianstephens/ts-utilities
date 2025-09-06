
export class Lazy<T> {
	private _value: T | undefined;
	constructor(private factory: () => T) {}
	get value() {
		if (this._value === undefined)
			this._value = this.factory();
		return this._value;
	}
	// Add 'then' method only when T is a Promise
	then<U>(this: T extends Promise<infer R> ? Lazy<T> : never, onFulfilled: (value: T extends Promise<infer R> ? R : never) => U): Promise<U> {
		return (this.value as any).then(onFulfilled);
	}
}

export class AsyncLazy<T> {
	private _value: T | null | undefined;
	constructor(private factory: () => Promise<T>) {}
	get value() {
		if (this._value === undefined) {
			this._value = null;
			this.factory().then(v => this._value = v);
		}
		return this._value;
	}
	then(fn: (v: T) => void) {
		if (this._value === undefined) {
			this._value = null;
			this.factory().then(v => {
				this._value = v;
				fn(v);
			});
		} else if (this._value !== null) {
			fn(this._value);
		}
	}
}

export class CallCombiner0 {
	private timeout:	ReturnType<typeof setTimeout> | null = null;

	combine(delay: number, func: ()=>void) {
		if (this.timeout)
			clearTimeout(this.timeout);
		this.timeout = setTimeout(()=> {
			this.timeout = null;
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
		remove: (fullpath: string) => {
			delete cache[fullpath];
		},
	};
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
