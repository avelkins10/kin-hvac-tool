import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function getServerSession() {
  return await auth()
}
