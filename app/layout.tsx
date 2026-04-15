import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VM-Tips 2026",
  description: "Tippa fotbolls-VM med vännerna",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
