import type { NextRequest } from "next/server"
import { validateRequest } from "@/lib/auth/lucia"

export async function GET(request: NextRequest) {
  const { user } = await validateRequest(request)
  if (!user) return Response.json({ user: null }, { status: 200 })
  // Lucia V3: user.attributes содержат кастомные поля
  // @ts-ignore
  const email = (user as any).email ?? (user as any).attributes?.email
  // @ts-ignore
  const createdAt = (user as any).createdAt ?? (user as any).attributes?.createdAt
  return Response.json({ user: { id: user.id, email, createdAt } }, { status: 200 })
}
