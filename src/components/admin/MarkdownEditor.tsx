'use client'

import dynamic from 'next/dynamic'
import type { MDEditorProps } from '@uiw/react-md-editor'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function MarkdownEditor(props: MDEditorProps) {
  return (
    <div data-color-mode="dark">
      <MDEditor {...props} />
    </div>
  )
}
