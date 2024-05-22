export const P = <T>(fn: (object: T) => void) => {
  const fnStr = fn.toString();
  const arr = fnStr.match(/(\.)[\S]+/);
  return arr?.[0].slice(1);
};

function cleanseAssertionOperators(parsedName: string): string {
  return parsedName.replace(/[?!]/g, '');
}

export const C = <T>(property: { new (...params: any[]): T }) => {
  const propertyStr = property.toString();
  return cleanseAssertionOperators(
    propertyStr.substring('class '.length, propertyStr.indexOf(' {')),
  );
};

export const N = <T>(name: keyof T) => name;

export const NF =
  <T>() =>
  (name: keyof T) =>
    name;

export const NF2 =
  <T>(nf: (name: string) => string) =>
  (name: keyof T) =>
    nf(name as string);
