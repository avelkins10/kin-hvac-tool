/**
 * DEBUG: Shows detailed request info including all headers
 */
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  return NextResponse.json({
    url: request.url,
    cookies: request.cookies.getAll(),
    headers,
  }, { status: 200 })
}
