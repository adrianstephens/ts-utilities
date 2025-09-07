
import {compare} from './utils';

//-----------------------------------------------------------------------------
//	iterator
//-----------------------------------------------------------------------------

export type SpreadType<T> = T extends Iterable<infer U> ? U[] : never;

export function arrayAppend<T, U extends Iterable<T>>(array: T[], items: U) {
	for (const i of items)
		array.push(i);
}

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

export function array_make<T>(n: number, constructor: new () => T): T[] {
	return Array.from({length: n}, () => new constructor);
}

export function eachIterable<T>(iterable: Iterable<T>|undefined, func: (v: T, i: number) => void) {
	if (iterable) {
		let i = 0;
		for (const v of iterable)
			func(v, i++);
	}
}

export function findIterable<T>(iterable: Iterable<T>|undefined, func: (v: T) => boolean) {
	if (iterable) {
		for (const v of iterable) {
			if (func(v))
				return v;
		}
	}
}

export function mapIterable<T, U>(iterable: Iterable<T>|undefined, func: (v: T, i: number) => U): U[] {
	return iterable ? Array.from(iterable, func) : [];
}

export async function asyncMap<T,U>(iterable: Iterable<T>|undefined, func:(v: T, i:number) => Promise<U>): Promise<U[]> {
	return Promise.all(mapIterable(iterable, func));
}

export async function asyncReduce<T, U>(array: T[], func: (acc: U, v: T, i: number, array: T[]) => Promise<U>, initialValue: U) {
	return array.reduce<Promise<U>>(
		async (promise, v, i, array) => func(await promise, v, i, array),
		Promise.resolve(initialValue)
	);
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

export function filterIterable<T>(iterable: Iterable<T>, func:(v: T, i: number)=>unknown): T[] {
	const array: T[] = [];
	let i = 0;
	for (const v of iterable)
		if (func(v, i++))
			array.push(v);
	return array;
}

export async function asyncFilter<T>(iterable: Iterable<T>, func:(v: T) => Promise<unknown>) {
	const filters = await Promise.all(mapIterable(iterable, func));
	return filterIterable(iterable, (_, i) => filters[i]);
}

export function mapObject<T, U>(obj: Record<string, T>, func:(x:[k:string, v:T])=>[k:string, v:U]) : Record<string, U> {
	return Object.fromEntries(Object.entries(obj).map(x => func(x)));
}

export function filterObject<T>(obj: Record<string, T>, func:(x:[k:string, v:T])=>boolean) : Record<string, T> {
	return Object.fromEntries(Object.entries(obj).filter(x => func(x)));
}
