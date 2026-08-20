import 'server-only';
import { paymentMethodLabel } from '@/entities/order/model/payment';
import { db } from '@/lib/db';

export interface MonthlyRevenuePoint {
  readonly month: string;
  readonly label: string;
  readonly revenueCents: number;
}

export interface TopProductRow {
  readonly productId: string;
  readonly name: string;
  readonly slug: string;
  readonly imageUrl: string | null;
  readonly soldQuantity: number;
  readonly revenueCents: number;
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-PH', { month: 'short' });

export async function getMonthlyRevenue(months = 12): Promise<readonly MonthlyRevenuePoint[]> {
  const rows = await db.$queryRaw<{ month: Date; revenue: bigint | null }[]>`
    SELECT date_trunc('month', "createdAt") AS month, SUM("totalCents") AS revenue
    FROM "orders"
    WHERE "status" <> 'CANCELLED'
      AND "createdAt" >= date_trunc('month', CURRENT_DATE) - make_interval(months => ${months - 1})
    GROUP BY 1
    ORDER BY 1`;

  const byMonth = new Map(
    rows.map((row) => [row.month.toISOString().slice(0, 7), Number(row.revenue ?? 0)]),
  );

  const series: MonthlyRevenuePoint[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() - (months - 1));

  for (let index = 0; index < months; index += 1) {
    const key = cursor.toISOString().slice(0, 7);

    series.push({
      month: key,
      label: MONTH_LABEL.format(cursor),
      revenueCents: byMonth.get(key) ?? 0,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}

export async function getTopProducts(limit = 5): Promise<readonly TopProductRow[]> {
  const rows = await db.$queryRaw<
    {
      productId: string;
      name: string;
      slug: string;
      imageUrl: string | null;
      sold: bigint;
      revenue: bigint;
    }[]
  >`
    SELECT oi."productId"      AS "productId",
           oi."productName"    AS name,
           oi."productSlug"    AS slug,
           MAX(oi."imageUrl")  AS "imageUrl",
           SUM(oi."quantity")  AS sold,
           SUM(oi."quantity" * oi."unitPriceCents") AS revenue
    FROM "order_items" oi
    JOIN "orders" o ON o."id" = oi."orderId"
    WHERE o."status" <> 'CANCELLED'
    GROUP BY oi."productId", oi."productName", oi."productSlug"
    ORDER BY revenue DESC
    LIMIT ${limit}`;

  return rows.map((row) => ({
    productId: row.productId,
    name: row.name,
    slug: row.slug,
    imageUrl: row.imageUrl,
    soldQuantity: Number(row.sold),
    revenueCents: Number(row.revenue),
  }));
}

export interface RevenueSlice {
  readonly label: string;
  readonly revenueCents: number;
}

export async function getRevenueByCategory(): Promise<readonly RevenueSlice[]> {
  const rows = await db.$queryRaw<{ label: string; revenue: bigint }[]>`
    SELECT c."name" AS label,
           SUM(oi."quantity" * oi."unitPriceCents") AS revenue
    FROM "order_items" oi
    JOIN "orders" o ON o."id" = oi."orderId"
    JOIN "_CategoryToProduct" cp ON cp."B" = oi."productId"
    JOIN "categories" c ON c."id" = cp."A"
    WHERE o."status" <> 'CANCELLED'
    GROUP BY c."name"
    ORDER BY revenue DESC`;

  return rows.map((row) => ({ label: row.label, revenueCents: Number(row.revenue) }));
}

export async function getRevenueByPaymentMethod(): Promise<readonly RevenueSlice[]> {
  const rows = await db.$queryRaw<{ label: string | null; revenue: bigint }[]>`
    SELECT "paymentMethod" AS label, SUM("totalCents") AS revenue
    FROM "orders"
    WHERE "status" <> 'CANCELLED'
    GROUP BY "paymentMethod"
    ORDER BY revenue DESC`;
    
  return rows.map((row) => ({
    label: paymentMethodLabel(row.label, null) ?? 'Unpaid',
    revenueCents: Number(row.revenue),
  }));
}
