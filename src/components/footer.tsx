export function Footer() {
  return (
    <footer className="bg-background border-t py-4">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} RideShare. All rights reserved.
      </div>
    </footer>
  );
}

