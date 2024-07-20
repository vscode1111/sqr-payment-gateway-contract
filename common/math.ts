export function bigIntSum<T>(array: T[], selector?: (value: T) => bigint) {
  return array.reduce(
    (acc: bigint, cur: T) => (acc += selector?.(cur) ?? (cur as bigint)),
    BigInt(0),
  );
}
