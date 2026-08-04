'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleAlert, Upload } from 'lucide-react';
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
import type { AuthenticatedUser } from '@/entities/user/model/types';
import { getUserInitials } from '@/entities/user/model/types';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/useToast';
import { getStorageCapabilities } from '@/lib/plugins/storage/capabilities';
import { updateProfileAction } from '../api/actions';

const formSchema = z.object({
  name: z.string().max(80, 'Name must be 80 characters or fewer.').nullable(),
  avatarUrl: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  readonly user: AuthenticatedUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { supportsUploads } = getStorageCapabilities();
  const { upload, isUploading, error: uploadError } = useImageUpload('avatars');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: user.name, avatarUrl: user.avatarUrl },
  });

  const avatarUrl = form.watch('avatarUrl');
  const isSubmitting = form.formState.isSubmitting;

  async function handleAvatarSelected(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    const uploaded = await upload(file);

    if (uploaded) {
      form.setValue('avatarUrl', uploaded.url, { shouldDirty: true });
    }
  }

  async function onSubmit(values: ProfileFormValues): Promise<void> {
    setSubmitError(null);

    const result = await updateProfileAction(values);

    if (!result.success) {
      if (result.error.issues.length > 0) {
        applyServerIssues(form, result.error.issues);
      } else {
        setSubmitError(result.error.message);
      }
      return;
    }

    toast.success('Profile updated');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-5" noValidate>
        {submitError ?? uploadError ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{submitError ?? uploadError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-4">
          <div className="bg-secondary text-secondary-foreground relative size-16 shrink-0 overflow-hidden rounded-full">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-lg font-medium">
                {getUserInitials(user)}
              </span>
            )}
          </div>

          {supportsUploads ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  void handleAvatarSelected(file);
                }}
                disabled={isSubmitting || isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                disabled={isSubmitting}
              >
                {isUploading ? null : <Upload aria-hidden="true" />}
                Change avatar
              </Button>
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => form.setValue('avatarUrl', null, { shouldDirty: true })}
                  disabled={isSubmitting || isUploading}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!supportsUploads ? (
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user.email} disabled readOnly />
          <p className="text-muted-foreground text-sm">Managed by your sign-in provider.</p>
        </div>

        <div>
          <Button type="submit" isLoading={isSubmitting} disabled={isUploading}>
            Save changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
