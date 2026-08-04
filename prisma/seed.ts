import { config as loadEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { ProductStatus } from '@/generated/prisma/enums';

loadEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set; cannot seed.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const FORCE_OVERWRITE = process.env.SEED_FORCE === 'true';

const IMAGE_BASE = 'https://images.unsplash.com/photo';

interface SeedVariant {
  readonly size?: string;
  readonly color?: string;
  readonly sku: string;
  readonly stock: number;
  readonly priceOverrideCents?: number;
}

interface SeedProduct {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly material: string;
  readonly basePriceCents: number;
  readonly baseStock: number;
  readonly sku: string;
  readonly featured: boolean;
  readonly categorySlug: string;
  readonly images: readonly string[];
  readonly variants: readonly SeedVariant[];
}

const CATEGORIES = [
  {
    name: 'Tops',
    slug: 'tops',
    parentSlug: null,
    description: 'Shirts, tees and knitwear cut for everyday wear.',
    imageUrl: `${IMAGE_BASE}-1521572163474-6864f9cf17ab?w=800&q=80`,
  },
  {
    name: 'Outerwear',
    slug: 'outerwear',
    parentSlug: null,
    description: 'Jackets and overshirts built for layering.',
    imageUrl: `${IMAGE_BASE}-1551028719-00167b16eac5?w=800&q=80`,
  },
  {
    name: 'Bottoms',
    slug: 'bottoms',
    parentSlug: null,
    description: 'Trousers, denim and shorts with a considered fit.',
    imageUrl: `${IMAGE_BASE}-1542272604-787c3835535d?w=800&q=80`,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    parentSlug: null,
    description: 'Bags, belts and the small things that finish a look.',
    imageUrl: `${IMAGE_BASE}-1553062407-98eeb64c6a62?w=800&q=80`,
  },
  {
    name: 'T-Shirts',
    slug: 't-shirts',
    parentSlug: 'tops',
    description: 'Short-sleeve cotton tees.',
    imageUrl: null,
  },
  {
    name: 'Knitwear',
    slug: 'knitwear',
    parentSlug: 'tops',
    description: 'Merino and lambswool knits.',
    imageUrl: null,
  },
  {
    name: 'Denim',
    slug: 'denim',
    parentSlug: 'bottoms',
    description: 'Selvedge and stretch denim.',
    imageUrl: null,
  },
] as const;

const PRODUCTS: readonly SeedProduct[] = [
  {
    name: 'Heavyweight Cotton Tee',
    slug: 'heavyweight-cotton-tee',
    description:
      'A 240gsm organic cotton tee with a boxy body and ribbed collar that holds its shape wash after wash. Garment dyed for a soft, lived-in hand.',
    material: '100% organic cotton',
    basePriceCents: 3800,
    baseStock: 0,
    sku: 'TL-TOP-001',
    featured: true,
    categorySlug: 't-shirts',
    images: [`${IMAGE_BASE}-1521572163474-6864f9cf17ab?w=1200&q=80`],
    variants: [
      { size: 'S', color: 'White', sku: 'TL-TOP-001-S-WHT', stock: 12 },
      { size: 'M', color: 'White', sku: 'TL-TOP-001-M-WHT', stock: 20 },
      { size: 'L', color: 'White', sku: 'TL-TOP-001-L-WHT', stock: 8 },
      { size: 'S', color: 'Black', sku: 'TL-TOP-001-S-BLK', stock: 0 },
      { size: 'M', color: 'Black', sku: 'TL-TOP-001-M-BLK', stock: 15 },
      { size: 'L', color: 'Black', sku: 'TL-TOP-001-L-BLK', stock: 4 },
    ],
  },
  {
    name: 'Merino Crew Knit',
    slug: 'merino-crew-knit',
    description:
      'Fine-gauge extra-fine merino in a clean crew neck. Breathable enough for indoors, warm enough under a jacket.',
    material: '100% extra-fine merino wool',
    basePriceCents: 11500,
    baseStock: 0,
    sku: 'TL-TOP-002',
    featured: true,
    categorySlug: 'knitwear',
    images: [`${IMAGE_BASE}-1576871337622-98d48d1cf531?w=1200&q=80`],
    variants: [
      { size: 'M', color: 'Navy', sku: 'TL-TOP-002-M-NVY', stock: 10 },
      { size: 'L', color: 'Navy', sku: 'TL-TOP-002-L-NVY', stock: 6 },
      // Price override, to exercise the fallback rule.
      { size: 'M', color: 'Oatmeal', sku: 'TL-TOP-002-M-OAT', stock: 3, priceOverrideCents: 12500 },
    ],
  },
  {
    name: 'Oxford Button-Down',
    slug: 'oxford-button-down',
    description:
      'Woven from Japanese oxford cloth with a soft roll collar and single-needle side seams. Cut slightly relaxed through the body.',
    material: '100% cotton oxford',
    basePriceCents: 8900,
    baseStock: 60,
    sku: 'TL-TOP-003',
    featured: false,
    categorySlug: 'tops',
    images: [`${IMAGE_BASE}-1602810318383-e386cc2a3ccf?w=1200&q=80`],
    variants: [],
  },
  {
    name: 'Waxed Chore Jacket',
    slug: 'waxed-chore-jacket',
    description:
      'A four-pocket chore coat in waxed British cotton. Weathers to a personal patina and shrugs off light rain.',
    material: 'Waxed British cotton',
    basePriceCents: 24900,
    baseStock: 0,
    sku: 'TL-OUT-001',
    featured: true,
    categorySlug: 'outerwear',
    images: [`${IMAGE_BASE}-1551028719-00167b16eac5?w=1200&q=80`],
    variants: [
      { size: 'M', color: 'Olive', sku: 'TL-OUT-001-M-OLV', stock: 7 },
      { size: 'L', color: 'Olive', sku: 'TL-OUT-001-L-OLV', stock: 5 },
      { size: 'XL', color: 'Olive', sku: 'TL-OUT-001-XL-OLV', stock: 0 },
    ],
  },
  {
    name: 'Quilted Liner Vest',
    slug: 'quilted-liner-vest',
    description:
      'Diamond-quilted recycled fill in a trim vest that layers cleanly under a coat without bulk at the shoulder.',
    material: 'Recycled polyester shell and fill',
    basePriceCents: 13900,
    baseStock: 34,
    sku: 'TL-OUT-002',
    featured: false,
    categorySlug: 'outerwear',
    images: [`${IMAGE_BASE}-1544022613-e87ca75a784a?w=1200&q=80`],
    variants: [],
  },
  {
    name: 'Selvedge Straight Denim',
    slug: 'selvedge-straight-denim',
    description:
      '13.5oz selvedge denim from a Japanese mill, cut straight from hip to hem with a mid rise. Raw and unsanforized.',
    material: '13.5oz Japanese selvedge denim',
    basePriceCents: 16500,
    baseStock: 0,
    sku: 'TL-BOT-001',
    featured: true,
    categorySlug: 'denim',
    images: [`${IMAGE_BASE}-1542272604-787c3835535d?w=1200&q=80`],
    variants: [
      { size: '30', color: 'Indigo', sku: 'TL-BOT-001-30-IND', stock: 9 },
      { size: '32', color: 'Indigo', sku: 'TL-BOT-001-32-IND', stock: 14 },
      { size: '34', color: 'Indigo', sku: 'TL-BOT-001-34-IND', stock: 2 },
    ],
  },
  {
    name: 'Pleated Wool Trouser',
    slug: 'pleated-wool-trouser',
    description:
      'A single-pleat trouser in tropical wool with a tailored waistband and clean drape to the ankle.',
    material: 'Tropical wool',
    basePriceCents: 18900,
    baseStock: 28,
    sku: 'TL-BOT-002',
    featured: false,
    categorySlug: 'bottoms',
    images: [`${IMAGE_BASE}-1473966968600-fa801b869a1a?w=1200&q=80`],
    variants: [],
  },
  {
    name: 'Canvas Weekender',
    slug: 'canvas-weekender',
    description:
      'A 20oz cotton canvas holdall with bridle leather handles and a brass zip. Sized for two nights away.',
    material: '20oz cotton canvas, bridle leather',
    basePriceCents: 19500,
    baseStock: 18,
    sku: 'TL-ACC-001',
    featured: true,
    categorySlug: 'accessories',
    images: [`${IMAGE_BASE}-1553062407-98eeb64c6a62?w=1200&q=80`],
    variants: [],
  },
  {
    name: 'Bridle Leather Belt',
    slug: 'bridle-leather-belt',
    description:
      'Vegetable-tanned bridle leather with a solid brass buckle. Stiff at first, moulds to you within a month.',
    material: 'Vegetable-tanned bridle leather',
    basePriceCents: 8500,
    baseStock: 0,
    sku: 'TL-ACC-002',
    featured: false,
    categorySlug: 'accessories',
    images: [`${IMAGE_BASE}-1624222247344-550fb60583dc?w=1200&q=80`],
    // Size-only variants — colour stays null, which the model permits.
    variants: [
      { size: '32', sku: 'TL-ACC-002-32', stock: 20 },
      { size: '34', sku: 'TL-ACC-002-34', stock: 25 },
      { size: '36', sku: 'TL-ACC-002-36', stock: 0 },
    ],
  },
  {
    name: 'Ribbed Wool Beanie',
    slug: 'ribbed-wool-beanie',
    description: 'A chunky ribbed beanie in lambswool with a deep cuff. Warm without the itch.',
    material: '100% lambswool',
    basePriceCents: 4500,
    baseStock: 0,
    sku: 'TL-ACC-003',
    featured: false,
    categorySlug: 'accessories',
    images: [`${IMAGE_BASE}-1576871337632-b9aef4c17ab9?w=1200&q=80`],
    variants: [],
  },
];

async function seedCategories(): Promise<Map<string, string>> {
  const idBySlug = new Map<string, string>();

  for (const pass of ['parents', 'children'] as const) {
    for (const category of CATEGORIES) {
      const isChild = category.parentSlug !== null;

      if ((pass === 'parents') === isChild) {
        continue;
      }

      const parentId = category.parentSlug ? (idBySlug.get(category.parentSlug) ?? null) : null;

      const data = {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        parentId,
      };

      const record = await prisma.category.upsert({
        where: { slug: category.slug },
        update: FORCE_OVERWRITE ? data : {},
        create: { slug: category.slug, ...data },
      });

      idBySlug.set(record.slug, record.id);
    }
  }

  return idBySlug;
}

async function main(): Promise<void> {
  console.info(
    `[seed] Seeding… (${FORCE_OVERWRITE ? 'overwriting existing' : 'existing rows preserved'})`,
  );

  const categoryIdBySlug = await seedCategories();
  console.info(`[seed] ${CATEGORIES.length} categories ready.`);

  let created = 0;
  let skipped = 0;
  let variantCount = 0;

  for (const product of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(
        `Product "${product.slug}" references unknown category "${product.categorySlug}".`,
      );
    }

    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    if (existing && !FORCE_OVERWRITE) {
      skipped += 1;
      continue;
    }

    const { images, variants, categorySlug: _categorySlug, ...productData } = product;

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
          isPrimary: index === 0,
        })),
      });

      await tx.productVariant.deleteMany({ where: { productId: record.id } });

      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((variant) => ({ ...variant, productId: record.id })),
        });
      }
    });

    created += 1;
    variantCount += variants.length;
  }

  console.info(
    `[seed] ${created} product(s) written with ${variantCount} variant(s), ${skipped} left untouched.`,
  );
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
