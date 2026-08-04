'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Wand2 } from 'lucide-react';
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
import { PRODUCT_STATUSES } from '@/entities/product/model/types';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/useToast';
import { createProductAction, updateProductAction } from '../api/actions';
import { createProductSchema, slugify } from '../model/schema';
import type { CreateProductInput } from '../model/schema';
import { ProductImageField } from './product-image-field';
import type { DraftImage } from './product-image-field';

interface ProductFormProps {
  readonly categories: readonly CategoryModel[];
  /** Present when editing; absent when creating. */
  readonly productId?: string;
  readonly defaultValues: CreateProductInput;
}

export function ProductForm({ categories, productId, defaultValues }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { upload } = useImageUpload('products');

  const [draftImages, setDraftImages] = useState<readonly DraftImage[]>(() =>
    defaultValues.images.map((image) => ({
      kind: 'uploaded' as const,
      url: image.url,
      storageKey: image.storageKey ?? null,
      alt: image.alt,
    })),
  );

  const isEditing = productId !== undefined;

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function resolveImages(): Promise<CreateProductInput['images'] | null> {
    const resolved: { url: string; alt?: string; storageKey?: string | null }[] = [];

    for (const image of draftImages) {
      if (image.kind === 'uploaded') {
        resolved.push({ url: image.url, alt: image.alt, storageKey: image.storageKey });
        continue;
      }

      const uploaded = await upload(image.file);

      if (!uploaded) {
        setSubmitError(`"${image.file.name}" could not be uploaded. Nothing was saved.`);
        return null;
      }

      resolved.push({ url: uploaded.url, storageKey: uploaded.storageKey });
    }

    return resolved;
  }

  async function onSubmit(values: CreateProductInput): Promise<void> {
    setSubmitError(null);

    const images = await resolveImages();

    if (!images) {
      return;
    }

    const payload = { ...values, images };

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
        {submitError ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Details</h2>

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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Pricing and stock</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
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
                  <FormDescription>In major units, e.g. 38.00</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compareAtPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compare-at price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === '' ? null : event.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>Optional. Shown struck through.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="TL-TOP-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </div>

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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Images</h2>
          <ProductImageField
            value={draftImages}
            onChange={setDraftImages}
            disabled={isSubmitting}
          />
        </section>

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
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
      </form>
    </Form>
  );
}
