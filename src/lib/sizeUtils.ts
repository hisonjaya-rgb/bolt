// Utility functions for handling size ordering

const SIZE_ORDER = ['F', 'XS', 'S', 'M', 'L', 'XL', 'S/M', 'L/XL'];

/**
 * Sorts sizes according to the standard order: F, XS, S, M, L, XL, S/M, L/XL
 * @param sizes Array of size strings to sort
 * @returns Sorted array of sizes
 */
export const sortSizes = (sizes: string[]): string[] => {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a);
    const indexB = SIZE_ORDER.indexOf(b);
    
    // If size not found in order, put it at the end
    const orderA = indexA === -1 ? SIZE_ORDER.length : indexA;
    const orderB = indexB === -1 ? SIZE_ORDER.length : indexB;
    
    return orderA - orderB;
  });
};

/**
 * Sorts an array of objects by their size property
 * @param items Array of objects with size property
 * @returns Sorted array of items
 */
export const sortBySizeProperty = <T extends { size: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.size);
    const indexB = SIZE_ORDER.indexOf(b.size);
    
    const orderA = indexA === -1 ? SIZE_ORDER.length : indexA;
    const orderB = indexB === -1 ? SIZE_ORDER.length : indexB;
    
    return orderA - orderB;
  });
};