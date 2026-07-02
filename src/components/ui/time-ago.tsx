'use client'

import { useEffect, useState } from 'react'

export function TimeAgo({ publishedAt }: { publishedAt: string }) {
  const [text, setText] = useState('')

  useEffect(() => {
    const hoursAgo = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 3600000)
    if (hoursAgo < 1) setText('Hace minutos')
    else if (hoursAgo < 24) setText(`Hace ${hoursAgo} horas`)
    else setText(`Hace ${Math.floor(hoursAgo / 24)} días`)
  }, [publishedAt])

  if (!text) return null
  return <>{text}</>
}
