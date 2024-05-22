export function getEnv(key: string) {
  const envKey = process.env[key];
  if (!envKey) {
    throw new Error(`Please set your ${key} in a .env file`);
  }
  return envKey;
}

export function checkConfig(config: object) {
  const entries = Object.entries(config);
  for (const entry of entries) {
    const key = entry[0];
    const value = entry[1];
    if (value === undefined) {
      throw new Error(`Please set your '${key}' in a env-file`);
    } else if (typeof value === 'object') {
      checkConfig(value);
    }
  }
}

export function parseBoolean(value: string | undefined) {
  return value?.toLowerCase() === 'true';
}
