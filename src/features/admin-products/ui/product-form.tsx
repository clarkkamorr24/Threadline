'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, CircleAlert, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  applyServerIssues,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import type { CategoryModel } from '@/entities/product/model/types';
import { cn } from '@/lib/utils';
import { PRODUCT_STATUSES } from '@/entities/product/model/types';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/useToast';
import { createProductAction, updateProductAction } from '../api/actions';
import { productDetailsSchema, slugify, validateVariants } from '../model/schema';
import type { ProductDetailsInput, VariantIssue } from '../model/schema';
import type { CreateProductInput } from '../model/schema';
import { VariantEditor, createEmptyVariant } from './variant-editor';
import type { VariantDraft } from './variant-editor';

function describeSelection(
  categories: readonly CategoryModel[],
  selectedIds: readonly string[],
): string {
  const names = categories
    .filter((category) => selectedIds.includes(category.id))
    .map((category) => category.name);

  if (names.length === 0) {
    return 'Select category';
  }

  if (names.length <= 3) {
    return names.join(', ');
  }

  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
}

interface ProductFormProps {
  readonly categories: readonly CategoryModel[];
  readonly productId?: string;
  readonly defaultValues: CreateProductInput;
}

export function ProductForm({ categories, productId, defaultValues }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { upload } = useImageUpload('products');

  const [variants, setVariants] = useState<readonly VariantDraft[]>(() =>
    defaultValues.variants.length > 0
      ? defaultValues.variants.map((variant) => ({
          id: variant.id ?? null,
          size: variant.size ?? '',
          color: variant.color ?? '',
          sku: variant.sku,
          stock: variant.stock,
          priceOverride: variant.priceOverride ?? null,
          images: variant.images.map((image) => ({
            kind: 'uploaded' as const,
            url: image.url,
            storageKey: image.storageKey ?? null,
          })),
        }))
      : [createEmptyVariant('', 0)],
  );

  const isEditing = productId !== undefined;

  const [variantIssues, setVariantIssues] = useState<readonly VariantIssue[]>([]);

  const form = useForm<ProductDetailsInput>({
    resolver: zodResolver(productDetailsSchema),
    defaultValues: {
      name: defaultValues.name,
      slug: defaultValues.slug,
      description: defaultValues.description,
      material: defaultValues.material,
      basePrice: defaultValues.basePrice,
      status: defaultValues.status,
      featured: defaultValues.featured,
      categoryIds: defaultValues.categoryIds,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function resolveVariants(): Promise<CreateProductInput['variants'] | null> {
    const resolved: CreateProductInput['variants'] = [];

    for (const variant of variants) {
      const images: { url: string; storageKey?: string | null }[] = [];

      for (const image of variant.images) {
        if (image.kind === 'uploaded') {
          images.push({ url: image.url, storageKey: image.storageKey });
          continue;
        }

        const uploaded = await upload(image.file);

        if (!uploaded) {
          setSubmitError(`"${image.file.name}" could not be uploaded. Nothing was saved.`);
          return null;
        }

        images.push({ url: uploaded.url, storageKey: uploaded.storageKey });
      }

      resolved.push({
        id: variant.id ?? null,
        size: variant.size ?? '',
        color: variant.color ?? '',
        sku: variant.sku,
        stock: variant.stock,
        priceOverride: variant.priceOverride ?? null,
        images,
      });
    }

    return resolved;
  }

  async function onSubmit(values: ProductDetailsInput): Promise<void> {
    setSubmitError(null);

    const issues = validateVariants(variants);
    setVariantIssues(issues);

    if (issues.length > 0) {
      setSubmitError(
        `Fix ${issues.length} problem${issues.length === 1 ? '' : 's'} in the variants below.`,
      );
      return;
    }

    const resolvedVariants = await resolveVariants();

    if (!resolvedVariants) {
      return;
    }

    const payload = { ...values, variants: resolvedVariants };

    const result = isEditing
      ? await updateProductAction({ ...payload, id: productId })
      : await createProductAction(payload);

    if (!result.success) {
      if (result.error.issues.length > 0) {
        applyServerIssues(form, result.error.issues);
      } else {
        setSubmitError(result.error.message);
      }
      return;
    }

    toast.success(isEditing ? 'Product updated' : 'Product created', values.name);
    router.push(ROUTES.admin.products);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {submitError ? (
          <Alert variant="destructive" className="mb-6 rounded-none">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            <section className="border-line bg-background border p-6">
              <h2 className="font-display mb-4.5 text-base font-extrabold">General</h2>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Heavyweight Cotton Tee" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="heavyweight-cotton-tee" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => field.onChange(slugify(form.getValues('name')))}
                        >
                          <Wand2 aria-hidden="true" />
                          Generate
                        </Button>
                      </div>
                      <FormDescription>Appears in the product URL. Must be unique.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="border-line bg-background border p-6">
              <h2 className="font-display mb-4.5 text-base font-extrabold">Pricing</h2>
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(event) => field.onChange(event.target.valueAsNumber)}
                            value={Number.isNaN(field.value) ? '' : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="100% organic cotton"
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value || null)}
                          />
                        </FormControl>
                        <FormDescription>Optional.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="categoryIds"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel>Categories</FormLabel>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild disabled={isSubmitting}>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              <span
                                className={cn(
                                  'truncate',
                                  field.value.length === 0 && 'text-muted-foreground',
                                )}
                              >
                                {describeSelection(categories, field.value)}
                              </span>
                              <ChevronDown aria-hidden="true" className="opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="max-h-72 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
                          >
                            {categories.map((category) => (
                              <DropdownMenuCheckboxItem
                                key={category.id}
                                checked={field.value.includes(category.id)}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, category.id]
                                      : field.value.filter((id: string) => id !== category.id),
                                  )
                                }
                              >
                                {category.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <FormDescription>
                          A product can appear in several categories. Pick at least one.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="border-line bg-background border p-6">
              <h2 className="font-display mb-4.5 text-base font-extrabold">Variants</h2>
              <div className="flex flex-col gap-4">
                <VariantEditor
                  value={variants}
                  onChange={(next) => {
                    setVariants(next);
                    setVariantIssues([]);
                  }}
                  issues={variantIssues}
                  baseSku={form.watch('slug').toUpperCase().replace(/-/g, '').slice(0, 10)}
                  disabled={isSubmitting}
                />
              </div>
            </section>

            {Object.keys(form.formState.errors).length > 0 ? (
              <Alert variant="destructive" className="rounded-none">
                <CircleAlert aria-hidden="true" />
                <AlertDescription>
                  Some required fields are missing or invalid. Check the highlighted fields.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <aside className="flex flex-col gap-5 self-start lg:sticky lg:top-24">
            <div className="border-line bg-background border p-5.5">
              <h2 className="font-display mb-4 text-base font-extrabold">Status</h2>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0) + status.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Only ACTIVE products are public.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex-row items-center gap-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Feature on the home page</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="flex-1 justify-center py-3.5"
              >
                {isEditing ? 'Save changes' : 'Create product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.admin.products)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </aside>
        </div>
      </form>
    </Form>
  );
}
