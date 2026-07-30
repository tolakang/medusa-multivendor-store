import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Medusa Multi-Vendor Store",
  description: "A multi-vendor e-commerce store built with Medusa 2.0",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
