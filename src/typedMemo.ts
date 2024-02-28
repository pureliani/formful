import { memo } from "react";

export const typedMemo: <A, B>(a: A, B: B) => A = memo;
