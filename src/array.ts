
import {compare as _compare, less} from './index';

//-----------------------------------------------------------------------------
//	array
//-----------------------------------------------------------------------------

//remove element of array
export function remove<T>(array: T[], item: T) {
	const index = array.indexOf(item);
	if (index === -1)
		return false;
	array.splice(index, 1);
	return true;
}

export function compare<T>(arr1: T[], arr2: T[]): number {
	const length = Math.min(arr1.length, arr2.length);
	for (let i = 0; i < length; i++) {
		const r = _compare(arr1[i], arr2[i]);
		if (r)
			return r;
	}
	return arr1.length - arr2.length;
}

export function equal<T>(arr1: T[], arr2: T[]): boolean {
	if (arr1.length !== arr2.length)
		return false;
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i])
			return false;
	}
	return true;
}

export function reverse<T>(array: T[], start: number, end: number): void {
    while (start < end) {
        [array[start], array[end]] = [array[end], array[start]];
        start++;
        end--;
    }
}

export function rotate<T>(array: T[], start: number, end: number, shift: number): void {
    const length = end - start;
    if (length > 1 && shift % length) {
		shift = ((shift % length) + length) % length;
		reverse(array, start, end - 1);
		reverse(array, start, start + shift - 1);
		reverse(array, start + shift, end - 1);
	}
}

export function make<T>(n: number, constructor: new () => T): T[] {
	return Array.from({length: n}, () => new constructor());
}

export function* lazySlice<T>(array: T[], start?: number, end?: number): Generator<T> {
	const len = array.length;
	if (start === undefined)
		start = 0;
	else if (start < 0)
		start = Math.max(len + start, 0);
	else
		start = Math.min(start, len);

	if (end === undefined)
		end = len;
	else if (end < 0)
		end = Math.max(len + end, 0);
	else
		end = Math.min(end, len);

	for (let i = start; i < end; i++)
		yield array[i];
}


export function lowerBound<T>(array: T[], value: T, func: (a: T, b: T, i: number) => boolean = less) {
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

export function argmin<T>(array: T[], func: (a: T, b: T) => number = _compare) {
	let mini	= 0;
	for (let i = 1; i < array.length; i++) {
		const v = func(array[i], array[mini]);
		if (v < 0)
			mini = i;
	}
	return mini;
}

export function min<T>(array: T[], func: (a: T, b: T) => number = _compare) {
	return array[argmin(array, func)];
}

export function argmax<T>(array: T[], func: (a: T, b: T) => number = _compare) {
	let maxi	= 0;
	for (let i = 1; i < array.length; i++) {
		const v = func(array[i], array[maxi]);
		if (v > 0)
			maxi = i;
	}
	return maxi;
}

export function max<T>(array: T[], func: (a: T, b: T) => number = _compare) {
	return array[argmax(array, func)];
}
