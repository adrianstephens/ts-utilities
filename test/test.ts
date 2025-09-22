import * as bits from '../src/bits';

export interface equal<T> {
	equal(b: T): boolean;
}

export function expect<T extends equal<T>>(v: T) {
	return {
		toEqual(v2: T) {
			if (!v.equal(v2))
				console.log("fail");
		}
	};
}

export function test(name: string, fn: ()=>void) {
	console.log("testing: " + name);
	fn();
	console.log("finished: " + name);
}

function timed(name: string, fn: ()=>void) {
	console.log("timed: " + name);
	const start = Date.now();
	fn();
	const end = Date.now();
	console.log("finished: " + name + " in " + (end - start) + "ms");
}

function highestSet1024(x: bigint): number {
	let s = 0;
	let k = 0;

	for (let t = x >> 1024n; t; t >>= BigInt(s)) {
		s = 1024 << k++;
		x = t;
	}

	if (k) {
		// determine length by bisection
		k--;
		while (k--) {
			const b = x >> BigInt(1024 << k);
			if (b) {
				s += 1024 << k;
				x = b;
			}
		}
	}

	const y = Number(x);
	let b = Math.floor(Math.log2(y));
	if (1n << BigInt(b) <= x)
		++b;
	return s + b;

//	return (s + 1024) - Math.clz32(Number(x));
}

for (let i = 0; i < 50; i++) {
	const n = Math.floor(Math.pow(1.5, i));
	const j = bits.lowestSet(1n << BigInt(n));
	console.log(i, j);
	if (j !== n)
		console.log('error');
}

//const sp = new DenseBits;
const sp = new bits.SparseBits2();
sp.setRange(42, 100);
sp.clearRange(64, 96);
sp.set(42);
sp.set(1000);
sp.set(10000);

for (const i of sp) {
	console.log(i);
}


/*
sp.selfNot();

for (let i = sp.next(-1, false); i !== -1; i = sp.next(i, false)) {
	console.log(i);
}
*/
sp.selfComplement();

for (const i of sp.ranges()) {
	console.log(i);
}


for (const i of sp.where(false)) {
	console.log(i);
}


for (let i = sp.next(-1); i !== -1; i = sp.next(i)) {
	console.log(i);
}
