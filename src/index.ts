import * as async from './async';

export * from './object';
export * from './iterator';
export * from './string';
export * from './algorithm';

export * as glob from './glob';
export * as bits from './bits';
export * as array from './array';
export * as async from './async';
export * as insensitive from './insensitive';

export async function parallel(...fns: (()=>any)[]): Promise<any[]> {
	return async.map(fns, f => f());
}

export async function serial(...fns: (()=>any)[]): Promise<any[]> {
	return async.mapSerial(fns, f => f());
}
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