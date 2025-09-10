
import {compare} from './object';

//-----------------------------------------------------------------------------
//	iterator
//-----------------------------------------------------------------------------

// resut of ...
export type SpreadType<T> = T extends Iterable<infer U> ? U[] : never;

//remove element of array
export function arrayRemove<T>(array: T[], item: T) {
	const index = array.indexOf(item);
	if (index === -1)
		return false;
	array.splice(index, 1);
	return true;
}

export function arrayCompare<T>(arr1: T[], arr2: T[]): number {
	const length = Math.min(arr1.length, arr2.length);
	for (let i = 0; i < length; i++) {
		const r = compare(arr1[i], arr2[i]);
		if (r)
			return r;
	}
	return arr1.length - arr2.length;
}

export function arrayEqual<T>(arr1: T[], arr2: T[]): boolean {
	if (arr1.length !== arr2.length)
		return false;
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i])
			return false;
	}
	return true;
}

export function arrayRotate<T>(array: T[], start: number, end: number, shift: number): void {
    const length = end - start;
    if (length > 1 && shift % length) {
		shift = ((shift % length) + length) % length;
		arrayReverse(array, start, end - 1);
		arrayReverse(array, start, start + shift - 1);
		arrayReverse(array, start + shift, end - 1);
	}
}

export function arrayReverse<T>(array: T[], start: number, end: number): void {
    while (start < end) {
        [array[start], array[end]] = [array[end], array[start]];
        start++;
        end--;
    }
}

export function arrayMake<T>(n: number, constructor: new () => T): T[] {
	return Array.from({length: n}, () => new constructor);
}

export function forEach<T>(iterable: Iterable<T>|undefined, func: (v: T, i: number) => void) {
	if (iterable) {
		let i = 0;
		for (const v of iterable)
			func(v, i++);
	}
}

export function find<T>(iterable: Iterable<T>|undefined, func: (v: T) => boolean) {
	if (iterable) {
		for (const v of iterable) {
			if (func(v))
				return v;
		}
	}
}

export function map<T, U>(iterable: Iterable<T>|undefined, func: (v: T, i: number) => U): U[] {
	return iterable ? Array.from(iterable, func) : [];
}

export function reduce<T, U>(iterable: Iterable<T>, func: (acc: U, v: T, i: number, iterable: Iterable<T>) => U, initialValue: U) {
	let i = 0;
	let acc = initialValue;
	for (const v of iterable)
		acc = func(acc, v, i++, iterable);
	return acc;
}

export function filter<T>(iterable: Iterable<T>, func:(v: T, i: number)=>unknown): T[] {
	const array: T[] = [];
	let i = 0;
	for (const v of iterable)
		if (func(v, i++))
			array.push(v);
	return array;
}

export async function asyncMap<T,U>(iterable: Iterable<T>|undefined, func:(v: T, i:number) => Promise<U>): Promise<U[]> {
	return Promise.all(map(iterable, func));
}

export async function asyncMapSerial<T,U>(iterable: Iterable<T>|undefined, func:(v: T, i:number) => Promise<U>): Promise<U[]> {
	const results: U[] = [];
	let i = 0;
	for (const v of iterable || [])
		results.push(await func(v, i++));
	return results;
}


export async function asyncReduce<T, U>(iterable: Iterable<T>, func: (acc: U, v: T, i: number, iterable: Iterable<T>) => Promise<U>, initialValue: U) {
	let i = 0;
	let acc = initialValue;
	for (const v of iterable)
		acc = await func(acc, v, i++, iterable);
	return acc;
/*
	return reduce<T, Promise<U>>(
		iterable,
		async (promise, v, i, iterable) => func(await promise, v, i, iterable),
		Promise.resolve(initialValue)
	);
	*/
}

export async function asyncFilter<T>(iterable: Iterable<T>, func:(v: T) => Promise<unknown>) {
	const filters = await Promise.all(map(iterable, func));
	return filter(iterable, (_, i) => filters[i]);
}


export async function parallel(...fns: (()=>any)[]): Promise<any[]> {
	return asyncMap(fns, f => f());
}
export async function serial(...fns: (()=>any)[]): Promise<any[]> {
	const results = [];
	for (const f of fns)
		results.push(await f());
	return results;
}

