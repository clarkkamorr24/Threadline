'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  applyServerIssues,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { slugify } from '@/features/admin-products/model/schema';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/useToast';
import { createCategoryAction, updateCategoryAction } from '../api/actions';
import { categorySchema } from '../model/schema';
import { CategoryImageField } from './category-image-field';
import type { CategoryImageDraft } from './category-image-field';
import type { CategoryInput } from '../model/schema';

interface CategoryFormProps {
  readonly categoryId?: string;
  readonly defaultValues: CategoryInput;
}

export function CategoryForm({ categoryId, defaultValues }: CategoryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { upload } = useImageUpload('categories');
  const [image, setImage] = useState<CategoryImageDraft>(
    defaultValues.imageUrl ? { kind: 'uploaded', url: defaultValues.imageUrl } : null,
  );

  const isEditing = categoryId !== undefined;

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CategoryInput): Promise<void> {
    setSubmitError(null);

    let imageUrl: string | null = null;

    if (image?.kind === 'uploaded') {
      imageUrl = image.url;
    } else if (image?.kind === 'pending') {
      const uploaded = await upload(image.file);

      if (!uploaded) {
        setSubmitError('The image could not be uploaded. Nothing was saved.');
        return;
      }

      imageUrl = uploaded.url;
    }

    values = { ...values, imageUrl };

    const result = isEditing
      ? await updateCategoryAction({ ...values, id: categoryId })
      : await createCategoryAction(values);

    if (!result.success) {
      if (result.error.issues.length > 0) {
        applyServerIssues(form, result.error.issues);
      } else {
        setSubmitError(result.error.message);
      }
      return;
    }

    toast.success(isEditing ? 'Category updated' : 'Category created', values.name);
    router.push(ROUTES.admin.categories);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w-2xl flex-col gap-4"
        noValidate
      >
        {submitError ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Outerwear" {...field} />
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
                  <Input placeholder="outerwear" {...field} />
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
                <Textarea
                  rows={3}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <Label>Image</Label>
          <CategoryImageField value={image} onChange={setImage} disabled={isSubmitting} />
          <p className="text-muted-foreground text-sm">Optional. Shown on the home page tile.</p>
        </div>

        <div className="mt-2 flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create category'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.categories)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
