import type { Selector } from "."

export const track = <S, R>(selector: Selector<S, R>): string[] => {
    const path: string[] = []
    const handler: ProxyHandler<any> = {
        get(_, p) {
            path.push(p as string)
            return new Proxy({}, handler)
        }
    }
    const proxy = new Proxy({}, handler)
    selector(proxy)
    return path
}
