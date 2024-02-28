function isObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

function areObjectKeysEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    return aKeys.every((key) => bKeys.includes(key));
}

export function equals(a: unknown, b: unknown, visited = new WeakMap()): boolean {
    if (a === b) return true;

    if (!isObject(a) || !isObject(b)) {
        return false;
    }

    if (visited.get(a) === b && visited.get(b) === a) {
        return true;
    }

    if (!areObjectKeysEqual(a, b)) {
        return false;
    }

    visited.set(a, b);
    visited.set(b, a);

    for (const key of Object.keys(a)) {
        if (!equals(a[key], b[key], visited)) {
            return false;
        }
    }

    return true;
}