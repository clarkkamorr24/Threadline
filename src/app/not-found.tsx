import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/constants/routes';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="The page you were looking for has moved or no longer exists."
        action={
          <Button asChild>
            <Link href={ROUTES.products}>Browse products</Link>
          </Button>
        }
      />
    </div>
  );
}
