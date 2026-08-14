export const PRODUCTS_PER_PAGE = 12;
export const ADMIN_ROWS_PER_PAGE = 10;
export const ORDER_HISTORY_STEP = 10;
export const ORDER_HISTORY_MAX = 200;
export const MAX_PAGE_SIZE = 60;

export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

export const MAX_CART_ITEM_QUANTITY = 20;
export const MAX_VARIANT_IMAGES = 6;
export const MAX_VARIANTS = 50;

export const FREE_SHIPPING_THRESHOLD_CENTS = 250_000;
export const FLAT_SHIPPING_RATE_CENTS = 15_000;
export const TAX_RATE_BASIS_POINTS = 1_200;
export const BASIS_POINTS_DIVISOR = 10_000;

export const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
] as const;

export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number]['value'];

export const DEFAULT_PRODUCT_SORT: ProductSort = 'newest';
