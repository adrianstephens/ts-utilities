class CaseInsensitiveString {
	private value: string;
	constructor(value: string)	{ this.value = value.toUpperCase(); }
	get length()				{ return this.value.length;}
	toString() 					{ return this.value; }
	toUpperCase() 				{ return this.value; }
	toLowerCase() 				{ return this.value.toLowerCase(); }
  
	includes(searchString: string, position?: number)	{ return this.value.includes(searchString.toUpperCase(), position); }
	startsWith(searchString: string, position?: number)	{ return this.value.startsWith(searchString.toUpperCase(), position); }
	endsWith(searchString: string, position?: number) 	{ return this.value.endsWith(searchString.toUpperCase(), position); }
	indexOf(searchString: string, position?: number) 	{ return this.value.indexOf(searchString.toUpperCase(), position); }
	lastIndexOf(searchString: string, position?: number){ return this.value.lastIndexOf(searchString.toUpperCase(), position); }

	compare(other: string|CaseInsensitiveString)		{ const bi = other.toUpperCase(); return this.value < bi ? -1 : this.value > bi ? 1 : 0; }
}

// keeps original string
class CaseInsensitiveString2 extends CaseInsensitiveString {
	constructor(private orig: string) { super(orig); }
	toString() 		{ return this.orig; }
}

export function String(value: string) {
	return new CaseInsensitiveString(value);
}
export function String2(value: string) {
	return new CaseInsensitiveString2(value);
}

export function compare(a: string, b: string) {
	const ai = a.toUpperCase(), bi = b.toUpperCase();
	return ai < bi ? -1 : ai > bi ? 1 : 0;
}

export function Record<T>(obj: Record<string, T>) {
	return new Proxy(obj, {
		get:		(target, name:string)				=> target[name.toUpperCase()],
		set:		(target, name:string, value:T)		=> (target[name.toUpperCase()] = value, true),
		has:		(target, name:string)				=> name.toUpperCase() in target,
		ownKeys:	(target)							=> Object.keys(target),
		getOwnPropertyDescriptor: (target, name:string) => Object.getOwnPropertyDescriptor(target, name),
	});
}

// keeps original record
export function Record2<T>(obj: Record<string, T>) {
	return new Proxy(Object.entries(obj).reduce((acc, [key, value]) => ((acc[key.toUpperCase()] = value), acc), {} as Record<string, T>), {
		get: 		(target, name:string)				=> target[name.toUpperCase()],
		set: 		(target, name:string, value:T)		=> (target[name.toUpperCase()] = value, true),
		has: 		(target, name:string)				=> name.toUpperCase() in target,
		ownKeys:	(_target) 							=> Object.keys(obj),
		getOwnPropertyDescriptor: (target, name:string) => Object.getOwnPropertyDescriptor(target, name)
	});
}

export class Map<T> extends globalThis.Map<string, T> {
	constructor(entries?: Iterable<[string, T]>) {
		super();
		if (entries) {
			for (const [key, value] of entries)
				this.set(key, value);
		}
	}

	delete(key: string) 		{ return super.delete(key.toUpperCase()); }
	get(key: string) 			{ return super.get(key.toUpperCase()); }
	has(key: string) 			{ return super.has(key.toUpperCase()); }
	set(key: string, value: T) 	{ return super.set(key.toUpperCase(), value); }
}

export class Set extends globalThis.Set<string> {
	constructor(values?: Iterable<string>) {
		super();
		if (values) {
			for (const value of values)
				this.add(value);
		}
	}
	add(value: string) 			{ return super.add(value.toUpperCase()); }
	delete(value: string)		{ return super.delete(value.toUpperCase()); }
	has(value: string) 			{ return super.has(value.toUpperCase()); }
}