import * as regexp from '../src/regexp';

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

const x = regexp.parse('[^\\D]+');
console.log(x);

const s = regexp.toRegExpString(x);
console.log(s);

const t = regexp.capture(regexp.text('test'));
console.log(regexp.toRegExpString(t));
