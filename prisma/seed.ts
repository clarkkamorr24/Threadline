import { config as loadEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { ProductStatus } from '../src/generated/prisma/enums';

loadEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set; cannot seed.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const IMAGE_BASE = 'https://images.unsplash.com/photo';

interface SeedProduct {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly priceCents: number;
  readonly compareAtCents: number | null;
  readonly sku: string;
  readonly stock: number;
  readonly featured: boolean;
  readonly categorySlug: string;
  readonly images: readonly string[];
}

const CATEGORIES = [
  {
    name: 'Tops',
    slug: 'tops',
    description: 'Shirts, tees and knitwear cut for everyday wear.',
    imageUrl: `${IMAGE_BASE}-1521572163474-6864f9cf17ab?w=800&q=80`,
  },
  {
    name: 'Outerwear',
    slug: 'outerwear',
    description: 'Jackets and overshirts built for layering.',
    imageUrl: `${IMAGE_BASE}-1551028719-00167b16eac5?w=800&q=80`,
  },
  {
    name: 'Bottoms',
    slug: 'bottoms',
    description: 'Trousers, denim and shorts with a considered fit.',
    imageUrl: `${IMAGE_BASE}-1542272604-787c3835535d?w=800&q=80`,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Bags, belts and the small things that finish a look.',
    imageUrl: `${IMAGE_BASE}-1553062407-98eeb64c6a62?w=800&q=80`,
  },
] as const;

const PRODUCTS: readonly SeedProduct[] = [
  {
    name: 'Heavyweight Cotton Tee',
    slug: 'heavyweight-cotton-tee',
    description:
      'A 240gsm organic cotton tee with a boxy body and ribbed collar that holds its shape wash after wash. Garment dyed for a soft, lived-in hand.',
    priceCents: 3800,
    compareAtCents: 4800,
    sku: 'TL-TOP-001',
    stock: 120,
    featured: true,
    categorySlug: 'tops',
    images: [`${IMAGE_BASE}-1521572163474-6864f9cf17ab?w=1200&q=80`],
  },
  {
    name: 'Merino Crew Knit',
    slug: 'merino-crew-knit',
    description:
      'Fine-gauge extra-fine merino in a clean crew neck. Breathable enough for indoors, warm enough under a jacket.',
    priceCents: 11500,
    compareAtCents: null,
    sku: 'TL-TOP-002',
    stock: 45,
    featured: true,
    categorySlug: 'tops',
    images: [`${IMAGE_BASE}-1576871337622-98d48d1cf531?w=1200&q=80`],
  },
  {
    name: 'Oxford Button-Down',
    slug: 'oxford-button-down',
    description:
      'Woven from Japanese oxford cloth with a soft roll collar and single-needle side seams. Cut slightly relaxed through the body.',
    priceCents: 8900,
    compareAtCents: null,
    sku: 'TL-TOP-003',
    stock: 60,
    featured: false,
    categorySlug: 'tops',
    images: [`${IMAGE_BASE}-1602810318383-e386cc2a3ccf?w=1200&q=80`],
  },
  {
    name: 'Waxed Chore Jacket',
    slug: 'waxed-chore-jacket',
    description:
      'A four-pocket chore coat in waxed British cotton. Weathers to a personal patina and shrugs off light rain.',
    priceCents: 24900,
    compareAtCents: 29900,
    sku: 'TL-OUT-001',
    stock: 22,
    featured: true,
    categorySlug: 'outerwear',
    images: [`${IMAGE_BASE}-1551028719-00167b16eac5?w=1200&q=80`],
  },
  {
    name: 'Quilted Liner Vest',
    slug: 'quilted-liner-vest',
    description:
      'Diamond-quilted recycled fill in a trim vest that layers cleanly under a coat without bulk at the shoulder.',
    priceCents: 13900,
    compareAtCents: null,
    sku: 'TL-OUT-002',
    stock: 34,
    featured: false,
    categorySlug: 'outerwear',
    images: [`${IMAGE_BASE}-1544022613-e87ca75a784a?w=1200&q=80`],
  },
  {
    name: 'Selvedge Straight Denim',
    slug: 'selvedge-straight-denim',
    description:
      '13.5oz selvedge denim from a Japanese mill, cut straight from hip to hem with a mid rise. Raw and unsanforized.',
    priceCents: 16500,
    compareAtCents: null,
    sku: 'TL-BOT-001',
    stock: 55,
    featured: true,
    categorySlug: 'bottoms',
    images: [`${IMAGE_BASE}-1542272604-787c3835535d?w=1200&q=80`],
  },
  {
    name: 'Pleated Wool Trouser',
    slug: 'pleated-wool-trouser',
    description:
      'A single-pleat trouser in tropical wool with a tailored waistband and clean drape to the ankle.',
    priceCents: 18900,
    compareAtCents: 22000,
    sku: 'TL-BOT-002',
    stock: 28,
    featured: false,
    categorySlug: 'bottoms',
    images: [`${IMAGE_BASE}-1473966968600-fa801b869a1a?w=1200&q=80`],
  },
  {
    name: 'Canvas Weekender',
    slug: 'canvas-weekender',
    description:
      'A 20oz cotton canvas holdall with bridle leather handles and a brass zip. Sized for two nights away.',
    priceCents: 19500,
    compareAtCents: null,
    sku: 'TL-ACC-001',
    stock: 18,
    featured: true,
    categorySlug: 'accessories',
    images: [`${IMAGE_BASE}-1553062407-98eeb64c6a62?w=1200&q=80`],
  },
  {
    name: 'Bridle Leather Belt',
    slug: 'bridle-leather-belt',
    description:
      'Vegetable-tanned bridle leather with a solid brass buckle. Stiff at first, moulds to you within a month.',
    priceCents: 8500,
    compareAtCents: null,
    sku: 'TL-ACC-002',
    stock: 70,
    featured: false,
    categorySlug: 'accessories',
    images: [`${IMAGE_BASE}-1624222247344-550fb60583dc?w=1200&q=80`],
  },
  {
    name: 'Ribbed Wool Beanie',
    slug: 'ribbed-wool-beanie',
    description:
      'A chunky ribbed beanie in lambswool with a deep cuff. Warm without the itch.',
    priceCents: 4500,
    compareAtCents: 5500,
    sku: 'TL-ACC-003',
    stock: 0,
    featured: false,
    categorySlug: 'accessories',
    images: [`${IMAGE_BASE}-1576871337632-b9aef4c17ab9?w=1200&q=80`],
  },
];

async function main(): Promise<void> {
  console.info('[seed] Seeding categories…');

  const categoryIdBySlug = new Map<string, string>();

  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      },
      create: category,
    });
    categoryIdBySlug.set(record.slug, record.id);
  }

  console.info(`[seed] ${CATEGORIES.length} categories ready.`);
  console.info('[seed] Seeding products…');

  for (const product of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(
        `Product "${product.slug}" references unknown category "${product.categorySlug}".`,
      );
    }

    const { images, categorySlug: _categorySlug, ...productData } = product;

    await prisma.$transaction(async (tx) => {
      const record = await tx.product.upsert({
        where: { slug: product.slug },
        update: { ...productData, categoryId, status: ProductStatus.ACTIVE },
        create: { ...productData, categoryId, status: ProductStatus.ACTIVE },
      });

      await tx.productImage.deleteMany({ where: { productId: record.id } });
      await tx.productImage.createMany({
        data: images.map((url, index) => ({
          productId: record.id,
          url,
          alt: product.name,
          position: index,
        })),
      });
    });
  }

  console.info(`[seed] ${PRODUCTS.length} products ready.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.info('[seed] Done.');
  })
  .catch(async (error: unknown) => {
    console.error('[seed] Failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
