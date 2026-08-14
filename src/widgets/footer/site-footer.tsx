import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

const FOOTER_SECTIONS = [
  {
    heading: 'Shop',
    links: [
      { label: 'All products', href: ROUTES.products },
      { label: 'New arrivals', href: `${ROUTES.products}?sort=newest` },
      { label: 'Cart', href: ROUTES.cart },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Our story', href: ROUTES.products },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Your orders', href: ROUTES.orders },
      { label: 'Account', href: ROUTES.account },
      { label: 'Sign in', href: ROUTES.signIn },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-line-strong mt-0 border-t-2">
      <div className="mx-auto grid max-w-360 gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="flex flex-col gap-3">
          <p className="font-display text-[22px] leading-none font-extrabold tracking-[-0.02em]">
            THREADLINE<span className="text-brand">.</span>
          </p>
          <p className="text-ink-70 max-w-xs text-sm leading-relaxed">
            Well-made basics and outerwear in natural fibres, cut for everyday wear and built to
            last.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <nav key={section.heading} aria-labelledby={`footer-${section.heading}`}>
            <h2
              id={`footer-${section.heading}`}
              className="text-ink-55 mb-4 font-mono text-[11px] tracking-[0.14em] uppercase"
            >
              {section.heading}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-brand text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-line text-ink-55 mx-auto flex max-w-360 flex-wrap justify-between gap-2 border-t px-5 py-6 font-mono text-[11px] tracking-[0.06em] uppercase lg:px-10">
        <span>© {new Date().getFullYear()} Threadline</span>
        <span>Built by Clark Amor</span>
      </div>
    </footer>
  );
}
