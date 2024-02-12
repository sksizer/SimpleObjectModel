export function toCamelCase(...args: (string | string[])[]): string {
  // Flatten the array in case an array of strings is passed as any of the arguments
  const words = ([] as string[]).concat(...args);

  // Process each word to create camelCase
  return words
    .map((word, index) => {
      // Split the word into parts (separated by space, underscore, or hyphen)
      let parts = word.split(/[\s-_]+/);

      // Convert the first letter of each part to uppercase (except for the first word)
      return parts
        .map((part, partIndex) => {
          return partIndex === 0 && index === 0
            ? part.toLowerCase()
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('');
    })
    .join('');
}

export function isNumber(value: any) {
  return typeof value === 'number';
}

export function normKey(key: string | number): string | number {
  if (isNumber(key)) {
    return key;
  }
  return (key as string).toLowerCase();
}

export function normalizeTypeName(name: string): string {
  if (name) {
    return name.toLowerCase();
  } else {
    throw new Error('normalizeTypeName: name is required');
  }
}
