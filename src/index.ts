import * as async from './async';

export * from './object';
export * from './iterator';
export * from './string';
export * from './algorithm';
export * from './glob';

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