
export function map<T, U>(obj: Record<string, T>, func:(x:[k:string, v:T])=>[k:string, v:U]) : Record<string, U> {
	return Object.fromEntries(Object.entries(obj).map(x => func(x)));
}

export function filter<T>(obj: Record<string, T>, func:(x:[k:string, v:T])=>boolean) : Record<string, T> {
	return Object.fromEntries(Object.entries(obj).filter(x => func(x)));
}

export function merge(...list: Record<string, any>[]) {
	function isObject(value: any): value is Record<string, any> {
		return typeof value === 'object' && value !== null;
	}

	function recurse(target: Record<string, any>, source: Record<string, any>) {
		for (const key in source) {
			if (isObject(source[key]) && isObject(target[key]))
				recurse(target[key], source[key]);
			else
				target[key] = source[key];
		}
		return target;
	}
	
	return list.reduce((merged, r) => recurse(merged, r), {});
}

export function isEmpty(obj: object) : boolean {
	return Object.keys(obj).length === 0;
}

export function clone<T extends object>(obj: T) : T {
	return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

