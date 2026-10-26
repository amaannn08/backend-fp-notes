import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Compass className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-3xl font-bold tracking-tight">404 — Lost in the routing layer</h1>
      <p className="max-w-md text-muted-foreground">
        This page doesn&apos;t exist. Maybe it 404&apos;d on purpose — chapter 6 did cover that.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/notes">Browse chapters</Link>
        </Button>
      </div>
    </div>
  );
}
