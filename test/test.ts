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


//const sp = new bits.DenseBits();
const sp = new bits.SparseBits2();
sp.setRange(42, 100);
sp.clearRange(64, 96);
sp.set(42);
sp.set(1000);
sp.set(10000);

for (const i of sp)
	console.log(i);


/*
sp.selfNot();

for (let i = sp.next(-1, false); i !== -1; i = sp.next(i, false)) {
	console.log(i);
}
*/

sp.set(0);
sp.set(2);
sp.selfComplement();
for (const i of sp.ranges())
	console.log(i);


for (const i of sp.where(false))
	console.log(i);


for (let i = sp.next(-1); i !== -1; i = sp.next(i))
	console.log(i);
