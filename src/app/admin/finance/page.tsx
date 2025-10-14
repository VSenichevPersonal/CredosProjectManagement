export default function FinanceRegistersPage() {
  const items = [
    { name: "Заказы", href: "/admin/finance/orders" },
    { name: "Услуги заказа", href: "/admin/finance/services" },
    { name: "Ручные доходы", href: "/admin/finance/revenues" },
    { name: "Доп.затраты", href: "/admin/finance/extra-costs" },
    { name: "Реестр зарплат", href: "/admin/finance/salary" },
    { name: "Правила распределения", href: "/admin/finance/allocations" },
  ]
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Финансовые регистры</h2>
      <ul className="list-disc pl-6">
        {items.map(i => (
          <li key={i.href}><a className="text-blue-600 underline" href={i.href}>{i.name}</a></li>
        ))}
      </ul>
    </div>
  )
}
