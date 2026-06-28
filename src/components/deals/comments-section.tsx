'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import { MessageCircle, Send } from 'lucide-react'

interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
}

interface CommentsSectionProps {
  dealId: string
  initialComments?: Comment[]
}

export function CommentsSection({ dealId, initialComments = [] }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const newComment: Comment = {
      id: Date.now().toString(),
      author: author.trim() || 'Anónimo',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }

    setComments(prev => [newComment, ...prev])
    setContent('')
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#E8F0FE' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
          <MessageCircle className="h-4 w-4" style={{ color: '#00D4FF' }} />
        </div>
        Comentarios ({comments.length})
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <Textarea
          placeholder="Escribe tu comentario sobre este chollo..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          className="resize-none rounded-xl"
          style={{ background: '#111827', borderColor: '#1E3A5F', color: '#E8F0FE' }}
        />
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tu nombre (opcional)"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="flex-1 h-10 rounded-xl px-4 text-sm focus:outline-none focus:ring-2"
            style={{ background: '#111827', border: '1px solid #1E3A5F', color: '#E8F0FE', outline: 'none' }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim()}
            className="h-10 px-5 font-semibold rounded-xl"
            style={{ background: '#00D4FF', color: '#0B1120' }}
          >
            <Send className="h-4 w-4 mr-1.5" />
            Comentar
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {comments.length === 0 && (
          <div className="text-center py-10 rounded-2xl" style={{ background: '#111827', border: '1px solid #1E3A5F' }}>
            <MessageCircle className="h-8 w-8 mx-auto mb-2" style={{ color: '#4A6080' }} />
            <p className="text-sm" style={{ color: '#8BA3C7' }}>Sé el primero en comentar este chollo.</p>
          </div>
        )}
        {comments.map(comment => (
          <div
            key={comment.id}
            className="flex gap-3 p-4 rounded-2xl"
            style={{ background: '#111827', border: '1px solid #1E3A5F' }}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="text-xs font-bold" style={{ background: '#1A2535', color: '#00D4FF' }}>
                {comment.author[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm" style={{ color: '#E8F0FE' }}>{comment.author}</span>
                <span className="text-xs" style={{ color: '#4A6080' }}>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#8BA3C7' }}>{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
