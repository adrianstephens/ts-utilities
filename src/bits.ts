
import { lowerBound } from "./algorithm";

//-----------------------------------------------------------------------------
// Bit twiddling functions
//-----------------------------------------------------------------------------

function ctz32(x: number): number {
    return x === 0 ? 32 : 31 - Math.clz32(x & -x);
}

function bitlengthSmall(x: number): number {
	return x ? 32 - Math.clz32(Number(x)) : 0;
}

const testersShift: bigint[] = [];	//32 << i
const testers:		bigint[] = [];	//1 << (32 << i)

function bitlengthBig(x: bigint): number {
	if (x < 0n)
		x = ~x;

	let k = 0
	for (;;) {
		if (!testers[k]) {
			testersShift[k]	= BigInt(32 << k);
			testers[k]		= 1n << testersShift[k];
		}
		if (x < testers[k])
			break
		k++
	}

	if (k === 0)
		return bitlengthSmall(Number(x));

	// determine length by bisection
	k--
	let i = 1 << k;
	let a = x >> testersShift[k];
	while (k--) {
		let b = a >> testersShift[k]
		if (b) {
			i += 1 << k;
			a = b;
		}
	}

	return (i + 1) * 32 - Math.clz32(Number(a));
}

export function bitlength(x: bigint|number): number {
	return typeof x === 'number' && x < 0x100000000 ? bitlengthSmall(x) : bitlengthBig(BigInt(x));
}

function bitcountSmall(x: number): number {
	x = x - ((x >> 1) & 0x55555555)
	x = (x & 0x33333333) + ((x >> 2) & 0x33333333)
	return ((x + (x >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

function bitcountBig(x: bigint): number {
	const n = bitlengthBig(x);

	let count = 0;
	for (let i = 0; i < n; i += 32) {
		count += bitcountSmall(Number(x & 0xFFFFFFFFn));
		x >>= 32n;
	}
	return count;

/*
	let mask = 1n << BigInt(n - 1) / 3n;

	let a = x & mask;
	x >>= 1n;
	let b = x & mask;
	x = a + b;
*/
}

export function bitcount(x: bigint|number): number {
	return typeof x === 'number' && x < 0x100000000 ? bitcountSmall(x) : bitcountBig(BigInt(x));
}

//-----------------------------------------------------------------------------
// SparseBits - a sparse bitset implementation, where each entry in the 'bits' array represents 32 bits.
// The 'undef' member indicates whether undefined entries are treated as 0 (false) or -1 (true).
//-----------------------------------------------------------------------------
export class ImmutableSparseBits {
	protected bits: number[] = [];	//each entry represents 32 bits
	protected undef = 0;

	constructor(init = false) {
		this.undef = init ? -1 : 0;
	}

	protected copyUndefined(other: ImmutableSparseBits): this {
		for (const i in other.bits) {
			if (this.bits[i] === undefined)
				this.bits[i] = other.bits[i];
		}
		return this;
	}

	protected create(init?: boolean): this {
		return new (this.constructor as new (init?: boolean) => this)(init);
	}

	not(): this {
		const result = this.create(this.undef === 0);
		for (const i in this.bits)
			result.bits[i] = ~this.bits[i];
		return result;
	}

	intersect(other: ImmutableSparseBits): this {
		const init		= !!(this.undef & other.undef);
		const result	= this.create(init);
		for (const i in this.bits)
			result.bits[i] = this.bits[i] & other.bits[i];
		return init ? result.copyUndefined(other) : result;
	}

	union(other: SparseBits): this {
		const init		= !!(this.undef | other.undef);
		const result	= this.create(init);
		for (const i in other.bits)
			result.bits[i] = this.bits[i] | other.bits[i];
		return init ? result : result.copyUndefined(other);
	}

	contains(other: SparseBits): boolean {
		if (other.undef && !this.undef)
			return false;
		for (const i in other.bits) {
			if (other.bits[i] & ~(this.bits[i] ?? this.undef))
				return false;
		}
		return true;
	}

	has(a: number) {
		const i = a >> 5;
		return !!((this.bits[i] ?? this.undef) & (1 << (a & 0x1f)));
	}

	next(a: number): number {
		const keys = Object.keys(this.bits).map(k => +k);
		if (keys.length === 0)
			return -1;//this.undef ? a : -1;
		
		++a;
		let i = lowerBound(keys, a >> 5);
		let v = this.bits[keys[i]] & (-(1 << (a & 0x1f)));

		while (!v) {
			++i;
			if (i === keys.length)
				return -1;
			v = this.bits[keys[i]];
		}

		return (keys[i] << 5) + ctz32(v);
	}

	toDense(): DenseBits {
		let bits = 0n;
		if (this.undef) {
			for (const i in this.bits)
				bits |= BigInt(~this.bits[i]) << BigInt(+i * 32);
			bits = ~bits;
		} else {
			for (const i in this.bits)
				bits |= BigInt(this.bits[i]) << BigInt(+i * 32);
		}
		return new DenseBits(bits);
	}
}

export class SparseBits extends ImmutableSparseBits {
	constructor(init = false) {
		super(init);
	}

	create(init?: boolean): this {
		return new (this.constructor as new (init?: boolean) => this)(init);
	}

	private setMask(i: number, b: number) {
		if (this.bits[i] !== undefined)
			this.bits[i] |= b;
		else if (!this.undef)
			this.bits[i] = b;
	}
	private clearMask(i: number, b: number) {
		if (this.bits[i] !== undefined)
			this.bits[i] &= ~b;
		else if (this.undef)
			this.bits[i] = ~b;
	}

	selfNot(): this {
		this.undef = ~this.undef;
		for (const i in this.bits)
			this.bits[i] = ~this.bits[i];
		return this;
	}

	selfIntersect(other: SparseBits): this {
		for (const i in this.bits)
			this.bits[i] &= other.bits[i];
		if (this.undef)
			this.copyUndefined(other);
		this.undef &= other.undef;
		return this;
	}

	selfUnion(other: SparseBits): this {
		this.undef |= other.undef;
		for (const i in other.bits)
			this.bits[i] |= other.bits[i];
		return this.undef ? this : this.copyUndefined(other);
	}

	set(a: number) {
		this.setMask(a >> 5, 1 << (a & 0x1f));
	}
	clear(a: number) {
		this.clearMask(a >> 5, 1 << (a & 0x1f));
	}
	has(a: number) {
		const i = a >> 5;
		return !!((this.bits[i] ?? this.undef) & (1 << (a & 0x1f)));
	}

	setRange(a: number, b: number) {
		let i = a >> 5, j = b >> 5;
		if (i === j) {
			this.setMask(i, (1 << (b & 0x1f)) - (1 << (a & 0x1f)));
		} else {
			this.setMask(i, -(1 << (a & 0x1f)));
			if (this.undef) {
				while (i < j)
					delete this.bits[i++];
			} else {
				while (i < j)
					this.bits[i++] = -1;
			}
			this.setMask(i, (1 << (b & 0x1f)) - 1);
		}
		return this;
	}
	clearRange(a: number, b: number) {
		let i = a >> 5, j = b >> 5;
		if (i === j) {
			this.clearMask(i, (1 << (b & 0x1f)) - (1 << (a & 0x1f)));
		} else {
			this.clearMask(i, -(1 << (a & 0x1f)));
			if (!this.undef) {
				while (i < j)
					delete this.bits[i++];
			} else {
				while (i < j)
					this.bits[i++] = 0;
			}
			this.clearMask(i, (1 << (b & 0x1f)) - 1);
		}
		return this;
	}
};

//-----------------------------------------------------------------------------
// DenseBits - a dense bitset implementation using bigint
//-----------------------------------------------------------------------------
export class DenseBits {

	constructor(private bits: bigint = 0n) {
	}

	complement(): DenseBits {
		this.bits = ~this.bits;
		return this;
	}
	toComplement(): DenseBits {
		return new DenseBits(~this.bits);
	}

	intersect(other: DenseBits): DenseBits {
		this.bits &= other.bits;
		return this;
	}
	toIntersect(other: DenseBits): DenseBits {
		return new DenseBits(this.bits & other.bits);
	}

	union(other: DenseBits): DenseBits {
		return new DenseBits(this.bits | other.bits);
	}
	toUnion(other: DenseBits): DenseBits {
		return new DenseBits(this.bits | other.bits);
	}

	set(a: number) {
		this.bits |= 1n << BigInt(a);
	}
	clear(a: number) {
		this.bits &= ~(1n << BigInt(a));
	}
	has(a: number) {
		return !!(this.bits & (1n << BigInt(a)));
	}
	
	setRange(a: number, b: number) {
		this.bits |= (1n << BigInt(b)) - (1n << BigInt(a));
		return this;
	}
	clearRange(a: number, b: number) {
		this.bits &= ~((1n << BigInt(b)) - (1n << BigInt(a)));
		return this;
	}

	get length() {
		return bitlengthBig(this.bits);
	}
};
