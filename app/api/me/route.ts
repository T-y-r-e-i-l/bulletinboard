import { NextResponse } from "next/server"
import { getClientIp, identityFromIp } from "@/lib/identity"

export async function GET(request: Request) {
  const identity = identityFromIp(getClientIp(request.headers))
  return NextResponse.json(identity)
}
