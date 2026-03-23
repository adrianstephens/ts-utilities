
import * as array from './array';

// result of ...
export type SpreadType<T> = T extends Iterable<infer U> ? U[] : never;

export function remove<T>(iterable: Iterable<T>, item: T) {
	return array.remove(Array.from(iterable), item);
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

type PartitionIndex<U> = U extends boolean ? 'true'|'false' : U;

export function partition<T, U extends keyof any | boolean>(array: Iterable<T>, func: (v: T) => U) : Record<PartitionIndex<U>, T[]> {
	const partitions = {} as Record<PartitionIndex<U>, T[]>;
	for (const i of array)
		(partitions[func(i) as unknown as PartitionIndex<U>] ??= []).push(i);
	return partitions;
}
