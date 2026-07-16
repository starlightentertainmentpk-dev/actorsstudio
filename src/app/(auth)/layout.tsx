export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 text-foreground p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-300 via-brand-500 to-brand-700 bg-clip-text text-transparent">
            Actor's Studio
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Pakistan's premier talent marketplace
          </p>
        </div>
        <div className="bg-card/45 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
