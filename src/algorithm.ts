import { compare } from "./utils";

type PartitionIndex<U> = U extends boolean ? 'true'|'false' : U;

export function partition<T, U extends keyof any | boolean>(array: Iterable<T>, func: (v: T) => U) : Record<PartitionIndex<U>, T[]> {
	const partitions = {} as Record<PartitionIndex<U>, T[]>;
	for (const i of array)
		(partitions[func(i) as unknown as PartitionIndex<U>] ??= []).push(i);
	return partitions;
}

export function lowerBound<T>(array: T[], value: T, func: (a: T, b: T, i: number) => boolean) {
	let i = 0;
	for (let n = array.length; n; n >>= 1) {
		const mid = i + (n >> 1);
		if (func(array[mid], value, mid)) {
			i = mid + 1;
			--n;
		}
	}
	return i;
}

/*
export function argmin<T>(array: T[], func?: (i: T) => number) {
	let mini	= 0;
	let minv	= func ? func(array[0]) : array[0];
	for (let i = 1; i < array.length; i++) {
		const v = func ? func(array[i]) : array[i];
		if (v < minv) {
			mini = i;
			minv = v;
		}
	}
	return mini;
}
	*/
export function argmin<T>(array: T[], func: (a: T, b: T) => number = compare) {
	let mini	= 0;
	for (let i = 1; i < array.length; i++) {
		const v = func(array[i], array[mini]);
		if (v < 0)
			mini = i;
	}
	return mini;
}

export function min<T>(array: T[], func: (a: T, b: T) => number = compare) {
	return array[argmin(array, func)];
}

export function argmax<T>(array: T[], func: (a: T, b: T) => number = compare) {
	let maxi	= 0;
	for (let i = 1; i < array.length; i++) {
		const v = func(array[i], array[maxi]);
		if (v > 0)
			maxi = i;
	}
	return maxi;
}

export function max<T>(array: T[], func: (a: T, b: T) => number = compare) {
	return array[argmax(array, func)];
}
