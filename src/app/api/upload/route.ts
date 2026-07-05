import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { adminApiCheck } from '@/lib/admin-auth'

const MAX_SIZE = 4 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif']

export async function POST(request: Request) {
  const authError = await adminApiCheck()
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'La imagen no puede superar 4MB' }, { status: 400 })
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado. Usa jpg, png, webp o gif.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXT.includes(ext)) {
    return NextResponse.json({ error: 'Formato no soportado. Usa jpg, png, webp o gif.' }, { status: 400 })
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al subir la imagen. Verifica que Vercel Blob esté configurado.' },
      { status: 500 }
    )
  }
}
