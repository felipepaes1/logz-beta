import { BaseResource } from "../base/BaseResource";

export function arrayUnique(values: Array<any>): Array<any> {
    return values.filter(
        (value, index, self) => self.indexOf(value) === index
    );
}

export function arrayUniqueByResourceId(array: Array<BaseResource>): Array<any> {
    return array.filter((value, index, self) =>
        index === self.findIndex((item) => (
            item.getApiId() === value.getApiId()
        ))
    );
}

export function arrayMaxValue(values: Array<number>): number {
    return Math.max(...values) ?? 0;
}

export function isDivergentArrays(a1: Array<string>, a2: Array<string>): boolean {
    return a1 && a2 && (a1.length != a2.length || a1.some((a) => !a2.includes(a)));
}

export function removeEmptyValues(array: Array<any>): Array<any> {
    return array.filter(value => value);
}
