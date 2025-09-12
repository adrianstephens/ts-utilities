import * as iterator from './iterator';

//-----------------------------------------------------------------------------
//	async
//-----------------------------------------------------------------------------

//let forceSerial = false;

export async function map<T,U>(iterable: Iterable<T>|undefined, func:(v: T, i:number) => Promise<U>): Promise<U[]> {
	return Promise.all(iterator.map(iterable, func));
}

export async function mapSerial<T,U>(iterable: Iterable<T>|undefined, func:(v: T, i:number) => Promise<U>): Promise<U[]> {
	const results: U[] = [];
	let i = 0;
	for (const v of iterable || [])
		results.push(await func(v, i++));
	return results;
}


export async function reduce<T, U>(iterable: Iterable<T>, func: (acc: U, v: T, i: number, iterable: Iterable<T>) => Promise<U>, initialValue: U) {
	let acc = initialValue;
	let i = 0;
	for (const v of iterable)
		acc = await func(acc, v, i++, iterable);
	return acc;
}

export async function filter<T>(iterable: Iterable<T>, func:(v: T) => Promise<unknown>) {
	const filters = await map(iterable, func);
	return iterator.filter(iterable, (_, i) => filters[i]);
}


