import * as speak from "speakeasy";
export const generateSecret = () => {
  const secret = speak.generateSecret({ length: 20 });
  return secret;
};


export function flattenObject(obj: any, prefix = ""): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    const value = obj[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, prefixedKey));
    } else {
      result[prefixedKey] = value;
    }
  }

  return result;
}