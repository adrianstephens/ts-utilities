
export class SparseBits {
	protected bits: number[] = [];	//each entry represents 32 bits
	protected undef = 0;

	constructor(init = false) {
		this.undef = init ? -1 : 0;
	}

	private copyUndefined(other: SparseBits): this {
		for (const i in other.bits) {
			if (this.bits[i] === undefined)
				this.bits[i] = other.bits[i];
		}
		return this;
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

	complement(): this {
		this.undef = ~this.undef;
		for (const i in this.bits)
			this.bits[i] = ~this.bits[i];
		return this;
	}
	toComplement(): SparseBits {
		const result = new SparseBits(this.undef === 0);
		for (const i in this.bits)
			result.bits[i] = ~this.bits[i];
		return result;
	}

	intersect(other: SparseBits): this {
		this.undef &= other.undef;
		for (const i in this.bits)
			this.bits[i] &= other.bits[i];
		return this.undef ? this.copyUndefined(other) : this;
	}
	toIntersect(other: SparseBits): SparseBits {
		const init		= !!(this.undef & other.undef);
		const result	= new SparseBits(init);
		for (const i in this.bits)
			result.bits[i] = this.bits[i] & other.bits[i];
		return init ? result.copyUndefined(other) : result;
	}

	union(other: SparseBits): this {
		this.undef |= other.undef;
		for (const i in other.bits)
			this.bits[i] |= other.bits[i];
		return this.undef ? this : this.copyUndefined(other);
	}
	toUnion(other: SparseBits): SparseBits {
		const init		= !!(this.undef | other.undef);
		const result	= new SparseBits(init);
		for (const i in other.bits)
			result.bits[i] = this.bits[i] | other.bits[i];
		return init ? result : result.copyUndefined(other);
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

	toDense(): DenseBits {
		let bits = 0n;
		if (this.undef) {
//			for (let i = 0; i < this.bits.length; i++)
//				bits |= BigInt(this.bits[i] ?? 0xffffffff) << BigInt(i * 32);
			for (const i in this.bits)
				bits |= BigInt(~this.bits[i]) << BigInt(+i * 32);
			bits = ~bits;
		} else {
			for (const i in this.bits)
				bits |= BigInt(this.bits[i]) << BigInt(+i * 32);
		}
		return new DenseBits(bits);
	}
};



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
