export default function DictionariesPage() {
  const items = [
    { name: "Направления", href: "/admin/dictionaries/directions" },
    { name: "Сотрудники", href: "/admin/dictionaries/employees" },
    { name: "Проекты", href: "/admin/dictionaries/projects" },
  ]
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Справочники</h2>
      <ul className="list-disc pl-6">
        {items.map(i => (
          <li key={i.href}><a className="text-blue-600 underline" href={i.href}>{i.name}</a></li>
        ))}
      </ul>
    </div>
  )
}
