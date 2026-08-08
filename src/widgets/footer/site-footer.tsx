import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

const FOOTER_SECTIONS = [
  {
    heading: 'Shop',
    links: [
      { label: 'All products', href: ROUTES.products },
      { label: 'Tops', href: ROUTES.category('tops') },
      { label: 'Outerwear', href: ROUTES.category('outerwear') },
      { label: 'Bottoms', href: ROUTES.category('bottoms') },
      { label: 'Accessories', href: ROUTES.category('accessories') },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Your orders', href: ROUTES.orders },
      { label: 'Cart', href: ROUTES.cart },
      { label: 'Sign in', href: ROUTES.signIn },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <p className="font-display text-lg font-semibold tracking-wide">Threadline</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Well-made basics and outerwear in natural fibres, cut for everyday wear.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <nav key={section.heading} aria-labelledby={`footer-${section.heading}`}>
            <h2
              id={`footer-${section.heading}`}
              className="mb-3 text-sm font-medium tracking-wide uppercase"
            >
              {section.heading}
            </h2>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium tracking-wide uppercase">Free shipping</h2>
          <p className="text-muted-foreground text-sm">
            On every order over $100. Returns accepted within 30 days.
          </p>
        </div>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto max-w-7xl px-4 py-6 text-sm">
          <p>© {new Date().getFullYear()} Threadline. A demonstration storefront.</p>
        </div>
      </div>
    </footer>
  );
}
