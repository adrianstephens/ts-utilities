
import {compare as objectCompare} from './object';

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
		const r = objectCompare(arr1[i], arr2[i]);
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
	return Array.from({length: n}, () => new constructor);
}
