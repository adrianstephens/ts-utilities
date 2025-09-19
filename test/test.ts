import { DenseBits, highestSet, SparseBits } from '../src/bits';

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

//test('make', () => {
//}

for (let offset = -100; offset <= 100; offset++)
	console.log(offset, highestSet((1n<<10n)+BigInt(offset)));

//const sp = new DenseBits;
const sp = new SparseBits(false);
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
