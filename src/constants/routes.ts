export const ROUTES = {
  home: '/',
  products: '/products',
  product: (slug: string) => `/products/${slug}`,
  category: (slug: string) => `/products?category=${encodeURIComponent(slug)}`,
  cart: '/cart',
  checkout: '/checkout',
  favorites: '/account/favorites',
  orders: '/account/orders',
  order: (id: string) => `/account/orders/${id}`,
  account: '/account',
  signIn: '/sign-in',
  signUp: '/sign-up',
  authCallback: '/auth/callback',
  admin: {
    root: '/admin',
    products: '/admin/products',
    newProduct: '/admin/products/new',
    editProduct: (id: string) => `/admin/products/${id}`,
    users: '/admin/users',
    orders: '/admin/orders',
    order: (id: string) => `/admin/orders/${id}`,
  },
} as const;

export const PROTECTED_PREFIXES = ['/account', '/cart', '/checkout', '/admin'] as const;

export const ADMIN_PREFIX = '/admin';

export const GUEST_ONLY_PREFIXES = ['/sign-in', '/sign-up'] as const;
