export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Администрирование</h1>
        <p className="text-sm text-muted-foreground">Справочники и настройки системы</p>
      </div>
      {children}
    </div>
  )
}
