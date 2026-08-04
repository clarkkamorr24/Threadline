/**
 * Store-wide settings.
 *
 * Currency moved here from a per-product column: every product in a single
 * storefront is priced in the same currency, and a per-row value only creates
 * the possibility of a cart containing two currencies that cannot be summed.
 */

export const STORE_CURRENCY = 'USD';
export const STORE_LOCALE = 'en-US';

/** Stock at or below this is surfaced as "low stock" in the admin dashboard. */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Sizes offered by the variant picker. Free text in the database so a product
 * can use waist measurements ("32") as easily as garment sizes.
 */
export const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
