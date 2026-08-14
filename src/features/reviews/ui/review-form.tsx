'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  REVIEW_BODY_MAX,
  REVIEW_RATING_MAX,
  REVIEW_TITLE_MAX,
} from '@/entities/review/model/types';
import type { ReviewModel } from '@/entities/review/model/types';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { submitReviewAction } from '../api/actions';
import { reviewSchema } from '../model/schema';
import type { ReviewValues } from '../model/schema';

interface ReviewFormProps {
  readonly productId: string;
  readonly productSlug: string;
  readonly existing: ReviewModel | null;
  readonly isAuthenticated: boolean;
  readonly signInHref: string;
}

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;

export function ReviewForm({
  productId,
  productSlug,
  existing,
  isAuthenticated,
  signInHref,
}: ReviewFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId,
      productSlug,
      rating: existing?.rating ?? 0,
      title: existing?.title ?? '',
      body: existing?.body ?? '',
    },
  });

  const rating = form.watch('rating');
  const isSubmitting = form.formState.isSubmitting;
  const preview = hovered ?? rating;

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline" className="mt-5 w-full justify-center">
        <a href={signInHref}>Sign in to review</a>
      </Button>
    );
  }

  async function onSubmit(values: ReviewValues): Promise<void> {
    setSubmitError(null);

    const result = await submitReviewAction(values);

    if (!result.success) {
      if (result.error.issues.length > 0) {
        applyServerIssues(form, result.error.issues);
      } else {
        setSubmitError(result.error.message);
      }
      return;
    }

    toast.success(existing ? 'Review updated' : 'Thanks for your review');
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSubmitError(null);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-5 w-full justify-center">
          {existing ? 'Edit your review' : 'Write a review'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit your review' : 'Write a review'}</DialogTitle>
          <DialogDescription>
            {existing
              ? 'Your review will be updated for everyone viewing this product.'
              : 'Tell other customers what you think of this piece.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            {submitError ? (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2" onMouseLeave={() => setHovered(null)}>
                      {Array.from({ length: REVIEW_RATING_MAX }, (_, index) => {
                        const value = index + 1;

                        return (
                          <button
                            key={value}
                            type="button"
                            aria-label={`${value} star${value === 1 ? '' : 's'}`}
                            aria-pressed={rating === value}
                            onMouseEnter={() => setHovered(value)}
                            onFocus={() => setHovered(value)}
                            onBlur={() => setHovered(null)}
                            onClick={() => field.onChange(field.value === value ? 0 : value)}
                            className="cursor-pointer p-0.5"
                          >
                            <Star
                              size={26}
                              strokeWidth={value <= preview ? 0 : 1.6}
                              fill={value <= preview ? 'currentColor' : 'none'}
                              className={cn(
                                'transition-colors',
                                value <= preview ? 'text-brand' : 'text-line-strong',
                              )}
                            />
                          </button>
                        );
                      })}
                      <span className="text-ink-55 ml-1 font-mono text-[11px] tracking-[0.06em] uppercase">
                        {preview > 0 ? RATING_LABELS[preview - 1] : 'Select a rating'}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={REVIEW_TITLE_MAX}
                      placeholder="Sums up your experience"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      maxLength={REVIEW_BODY_MAX}
                      placeholder="How is the fit, the fabric, the wear over time?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {existing ? 'Update review' : 'Submit review'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
