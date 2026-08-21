# Threadline

Threadline is an online clothing store. It has two sides that operate on the same
data: a **storefront** where customers browse and buy, and an **admin area** where
the catalogue, stock and orders are managed. Everything an admin does is visible
to customers immediately, and everything a customer does shows up for the admin.

This document describes how the application behaves end to end.

- [Core concepts](#core-concepts)
- [Customer flow](#customer-flow)
- [Admin flow](#admin-flow)
- [How the two sides interact](#how-the-two-sides-interact)
- [Rules the system enforces](#rules-the-system-enforces)
- [Built with](#built-with)

---

## Core concepts

**Product and variant.** A product (say "Classic Jeans") holds the name,
description, base price and categories. What a customer actually buys is a
**variant**: one specific size and colour pair, with its own SKU, stock count and
optional price override. Stock lives on the variant, never on the product.

**Colour groups.** Variants are grouped by colour. All the sizes of one colour
share a single set of images, so Black XS through Black XL show the same
photographs. The order of the colour groups is what a shopper sees on the product
page.

**Order status.** Every order moves through a fixed lifecycle:

```
PENDING ──► PROCESSING ──► SHIPPED ──► DELIVERED
   │             │
   └─────────────┴──► CANCELLED
```

`PENDING` means checkout began but payment never completed. `DELIVERED` and
`CANCELLED` are final — nothing moves out of them. This one rule governs what
both customers and admins are allowed to do at any moment.

**Money.** Prices are Philippine peso. Shipping is free above ₱2,500 and a flat
₱150 below it; tax is 12% of the subtotal. The customer is charged exactly the
figure they were shown.

---

## Customer flow

### 1. Browsing

The **home page** introduces the store: a hero, a rotating value strip, a
featured edit, a "Fresh this week" carousel of recent arrivals paged four at a
time, category tiles and a brand story.

The **catalogue** (`/products`) lists everything currently on sale. Customers can:

- **search** by name,
- **filter** by category, size, colour, price range and in-stock only,
- **sort** by newest, price ascending or descending, or name.

Every filter lives in the URL, so a filtered view can be bookmarked or shared,
and the back button behaves as expected. Only products an admin has set to
**Active** appear — drafts and archived products are invisible here.

### 2. Product detail

The product page shows the gallery for the selected colour, the price, the
description, materials and care notes, and customer reviews.

The customer picks a **colour**, then a **size**. The two selectors work
together: sizes not available in the chosen colour are struck through, and
colours unavailable in the chosen size are dimmed, so an impossible combination
cannot be selected. When only one variant exists it is preselected.

If a variant is out of stock the page says **Sold out** instead of offering it.
Low stock is called out ("Only 3 left") so the customer knows to hurry.

### 3. Cart

**Add to Cart** places the chosen variant in the cart and opens the cart drawer.
**Buy it now** does the same and goes straight to checkout. Product cards in
listings also offer a **Quick add** on hover for single-variant products.

In the cart the customer can change quantities or remove lines. Quantity is
capped by what is actually in stock and by a per-item maximum, and the cart shows
how much more is needed to reach free shipping. Totals update as items change.

The cart belongs to the account, so it survives across devices and sessions.

### 4. Checkout

Checkout runs through five signposted steps: **Cart → Information → Shipping →
Payment → Complete**.

The customer enters a shipping address and chooses to pay by card. When they
place the order:

1. The order is created and given a number such as `TL-B3CR46`.
2. **Stock is reserved immediately**, so the last item cannot be sold twice.
3. The customer is sent to **Stripe** to pay, on Stripe's own hosted page — card
   details never touch this application.

Stripe shows each product with its image, colour, size and price, plus shipping
and tax as separate lines, so the breakdown matches the cart the customer just
left.

### 5. Payment and confirmation

Once payment succeeds, Stripe returns the customer to the **confirmation page**
showing the order number, items and totals.

Payment is confirmed by Stripe itself, in two independent ways: a **webhook**
Stripe sends to the application, and a check the confirmation page performs when
the customer lands on it. Either is enough, so a missed webhook never leaves a
paid order looking unpaid. The card brand actually charged (Visa, Mastercard) is
recorded at this point.

A confirmed order moves from `PENDING` to `PROCESSING`, and the admin is notified.

**If payment is not completed** — the customer closes the tab, abandons the page
or the card is declined — the order stays `PENDING`. Nothing is charged and the
order will not ship.

### 6. Order history

**Account → Orders** separates orders into three tabs, each with a count:

| Tab           | Contains                       | Available actions              |
| ------------- | ------------------------------ | ------------------------------ |
| **Orders**    | Processing, Shipped, Delivered | Track, Cancel (until shipped)  |
| **Pending**   | Payments never completed       | Continue payment, Cancel order |
| **Cancelled** | Cancelled orders               | View                           |

History loads ten at a time with a **See more** control, and each row shows the
order number, date and time, item count, status and total.

### 7. Order detail and tracking

An order's page shows a **progress tracker** — Placed → Processing → Shipped →
Delivered — with the current stage highlighted, alongside the items, the price
breakdown and the shipping address.

A pending order additionally shows a **Payment not completed** panel explaining
that the items are held but will not ship.

### 8. Finishing an unpaid order

From the Pending tab or the order page, **Continue payment** returns the customer
to Stripe. The original checkout session is reused when it is still open;
otherwise a fresh one is created for the same order, so an expired link is never
a dead end.

### 9. Cancelling

**Cancel order** is offered while an order is `PENDING` or `PROCESSING`. The
customer confirms in a dialog, and then:

- the order becomes `CANCELLED` and moves to the Cancelled tab,
- **the reserved stock is released** back to the shop,
- any unfinished Stripe payment session is closed, so a checkout tab left open
  cannot be used to pay for an order that no longer exists.

**Once an order is Shipped it can no longer be cancelled**, and the action
disappears. This is enforced on the server, not merely hidden — the rule holds
even if the request is made directly.

### 10. Notifications

A bell in the storefront header carries an unread count. Customers are notified
whenever an order's status changes — "Order #TL-B3CR46 is on its way", "has been
delivered" — with the time it happened.

**The badge updates live.** When an admin marks an order shipped, the customer's
bell increments without a page refresh.

Notifications can be opened (going straight to the order), marked all as read, or
removed individually. **Account → Notifications** lists the full history.

### 11. Reviews

A customer can review a product **only after an order containing it has been
delivered**. This is checked against real order history, which is what makes the
"Verified buyer" label meaningful. Each customer has one review per product,
which they can edit later. The product page shows the average rating, a
distribution across five stars and the individual reviews.

### 12. Other account features

- **Wishlist** — save products to return to.
- **Profile** — change display name and avatar.
- **Overview** — recent orders and account summary.

Accounts are created with email and password, or with **Google**. Password reset
is available; entering an unregistered email says so rather than silently sending
nothing.

---

## Admin flow

### 1. Signing in

Admins use a **separate sign-in page** at `/admin/login`, styled distinctly from
the storefront. After authenticating, the account's role is checked; a customer
account signing in here is rejected and signed straight back out.

Admin status is granted by configuration, not through the interface — there is no
screen that promotes a customer to admin, so no request can escalate privileges.

Signing out of the admin returns to the admin login rather than the storefront.

### 2. Dashboard

The dashboard opens on the headline numbers — **revenue, orders, average order
value, customers** — with a twelve-month revenue trend, top-selling products and
the most recent orders.

**Revenue counts confirmed orders only.** Pending and cancelled orders are
excluded, so an abandoned checkout never inflates the figures.

### 3. Products

The product list supports search, sorting and pagination. Creating or editing a
product covers:

- **General** — name, URL slug, description,
- **Pricing** — base price, material, categories (at least one, none preselected),
- **Variants** — the sizes and colours actually sold,
- **Status** — Draft, Active or Archived, which controls storefront visibility.

### 4. Variants, colours and images

The variant editor groups everything by colour, so a product with five sizes in
two colours shows two collapsible rows rather than ten cards.

For each colour group the admin manages:

- **One shared image set** for all sizes of that colour — upload, replace an image
  in place, or remove it. Images upload directly to the storage provider, and
  variants sharing a photograph share a single stored file.
- **Sizes**, each with its own SKU, stock count and optional price override.

**Colour is chosen from a swatch picker**, not typed. A colour is only accepted if
the storefront can draw a swatch for it, which prevents a typo from shipping a
product whose colour renders as a grey blank.

**Colour groups are drag-reorderable.** The order set here is the order shoppers
see on the product page, so the colour an admin wants to lead with can be dragged
to the top.

### 5. Inventory

The inventory screen groups variants under their product, showing variant count,
total units and how many need restocking. It supports search across product name,
SKU, colour and size, sortable columns and pagination.

Products are ranked by **restock urgency** by default. Anything at or below five
units is flagged low stock, and zero is flagged out of stock.

### 6. Orders

The order list shows customer, date, item count, payment method, status and
total, filterable by status and searchable by order number or customer email.

**Unpaid checkouts are not listed here.** Since they are excluded from revenue,
they would otherwise sit misleadingly alongside real orders.

An order's page shows the progress tracker, the items, the totals, the customer
with their shipping address, and the payment method actually charged. A
**printable invoice** is available, laid out for A4.

### 7. Updating status

Status is changed from the order page, either with the **Update status** panel or
the one-click advance button ("Mark as shipped"). Only legal transitions are
offered, and the same rule is enforced server-side.

Every status change **notifies the customer immediately**.

### 8. Cancellations

Admins can cancel an order that is `PENDING` or `PROCESSING`, the same window
customers have. Shipped and delivered orders cannot be cancelled by either side.

### 9. Customers

The customer list shows each account with its order count and lifetime spend, and
supports search and pagination. Administrator accounts are not listed.

An account can be **suspended**, after a confirmation dialog naming the person.
A suspended customer is signed out, cannot sign back in, and is told their account
has been suspended. Their existing orders are untouched. **Restore** reverses it.

### 10. Admin notifications

The admin bell combines two sources:

- **New orders** — raised the moment a customer's payment succeeds, showing the
  order number, customer name and time.
- **Stock alerts** — variants at or below the low-stock threshold, out-of-stock
  first.

Both carry an unread count, can be marked read or dismissed individually, and are
listed in full on the notifications page. New orders arrive live, without a
refresh.

---

## How the two sides interact

| An admin does this                | The customer sees                                                 |
| --------------------------------- | ----------------------------------------------------------------- |
| Sets a product **Active**         | It appears in the catalogue and search                            |
| Sets it **Draft** or **Archived** | It disappears from the storefront                                 |
| Reorders colour groups            | Colours reorder on the product page                               |
| Replaces a colour's images        | The gallery updates for every size of that colour                 |
| Edits stock                       | Availability, "Only N left" and Sold out update                   |
| Marks an order **Shipped**        | Tracker advances, notification arrives live, cancel disappears    |
| Marks an order **Delivered**      | Tracker completes, and the customer may now review those products |
| **Suspends** an account           | The customer is signed out and cannot sign back in                |

| A customer does this | The admin sees                                                        |
| -------------------- | --------------------------------------------------------------------- |
| Completes payment    | Order appears in Orders, notification arrives live, revenue rises     |
| Abandons checkout    | Nothing in the order list; stock stays reserved until released        |
| **Cancels** an order | Order moves to Cancelled, stock returns to inventory, revenue adjusts |
| Buys the last unit   | Inventory shows out of stock and raises an alert                      |

---

## Rules the system enforces

These hold regardless of what the interface offers, because they are enforced on
the server:

**Stock cannot be oversold.** Reserving stock at checkout is a conditional
operation, so two people buying the last unit at the same moment cannot both
succeed.

**Prices come from the database.** Checkout accepts an address and nothing else —
never a price — so the total charged is always the total calculated from current
catalogue data.

**Payment status comes from Stripe**, through a signature-verified webhook and an
independent check on return. The browser is never trusted to say an order is paid.

**Shipped orders cannot be cancelled**, by customer or admin.

**Reviews require a delivered order** containing that product.

**Revenue counts confirmed orders only** — never pending, never cancelled.

**Cancelling releases stock**, so a cancelled order never holds inventory.

**Customers only ever see their own data.** Orders, notifications and cart access
are scoped to the signed-in account, so changing an identifier in a URL reaches
nothing.

**Admin pages verify the role on every request**, and every action re-checks it,
so admin functionality cannot be reached by a customer account.

---

## Built with

**Framework and language**

| Tool                        | Role                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **Next.js 16** (App Router) | Routing, server rendering and Server Actions — every mutation runs on the server          |
| **React 19**                | UI, largely as Server Components with client components only where interaction needs them |
| **TypeScript** (strict)     | Types across the whole codebase, including the generated database client                  |

**Data**

| Tool           | Role                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| **PostgreSQL** | Products, variants, orders, reviews, notifications                          |
| **Prisma 7**   | Schema, migrations and all database access, through the `pg` driver adapter |
| **Zod**        | Validating every input server-side before it reaches a service              |

**Services**

| Tool                  | Role                                                                               |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Supabase Auth**     | Sessions, email/password and Google sign-in, password reset                        |
| **Supabase Realtime** | Live notification badges, via a content-free broadcast that triggers a refetch     |
| **Stripe Checkout**   | Hosted card payments, plus signature-verified webhooks                             |
| **Cloudinary**        | Product and avatar images, uploaded straight from the browser with a signed ticket |

**Interface**

| Tool                       | Role                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| **Tailwind CSS 4**         | Styling, with the design system expressed as theme tokens        |
| **Radix UI**               | Accessible primitives — dialog, select, dropdown, toast, tooltip |
| **React Hook Form**        | Form state, sharing the same Zod schemas as the server           |
| **Zustand**                | Small client state, such as the cart drawer                      |
| **TanStack Query**         | Client-side data fetching where a component needs it             |
| **lucide-react**           | Icons                                                            |
| **Archivo** (Google Fonts) | Typeface, self-hosted through `next/font`                        |

**Tooling**

| Tool                        | Role                                                    |
| --------------------------- | ------------------------------------------------------- |
| **ESLint** and **Prettier** | Linting and formatting, with Tailwind class sorting     |
| **Docker**                  | Local Postgres, and a production image for self-hosting |
