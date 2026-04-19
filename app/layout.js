export const metadata = { title: 'Cassette', description: 'Your personal study manager' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}