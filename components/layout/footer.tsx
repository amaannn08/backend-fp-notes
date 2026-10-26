import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <p>
          Fan-made study notes for{" "}
          <a
            href="https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-foreground"
          >
            Backend from First Principles
          </a>{" "}
          by{" "}
          <a
            href="https://www.youtube.com/@sriniously"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-foreground"
          >
            Sriniously
          </a>
          .
        </p>
        <p className="flex items-center gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/print" className="hover:text-foreground">
            Print / PDF
          </Link>
        </p>
      </div>
    </footer>
  );
}
