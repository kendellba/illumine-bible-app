/**
 * Verse Sharing Service
 * Handles verse sharing with beautiful graphics generation
 */

import { supabase } from '@/services/supabase'
import type { VerseShare, ShareOptions, ShareResult } from '@/types/quickWins'
import { achievementsService } from './achievementsService'

export class VerseSharingService {
  /**
   * Share a verse as text
   */
  async shareAsText(
    verseId: string,
    verseText: string,
    verseReference: string,
    bibleVersionId: string,
    options: Partial<ShareOptions> = {}
  ): Promise<ShareResult> {
    const defaultOptions: ShareOptions = {
      includeReference: true,
      includeVersion: true,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'serif',
      fontSize: 16,
      template: 'minimal'
    }

    const shareOptions = { ...defaultOptions, ...options }

    let shareText = `"${verseText}"`

    if (shareOptions.includeReference) {
      shareText += `\n\n— ${verseReference}`
    }

    if (shareOptions.includeVersion) {
      shareText += ` (${bibleVersionId})`
    }

    try {
      // Record the share
      await this.recordShare(verseId, verseText, verseReference, bibleVersionId, 'text')

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `${verseReference} - Bible Verse`,
          text: shareText
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share verse'
      }
    }
  }

  /**
   * Generate and share verse as image
   */
  async shareAsImage(
    verseId: string,
    verseText: string,
    verseReference: string,
    bibleVersionId: string,
    options: Partial<ShareOptions> = {}
  ): Promise<ShareResult> {
    const defaultOptions: ShareOptions = {
      includeReference: true,
      includeVersion: true,
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      fontSize: 24,
      template: 'elegant'
    }

    const shareOptions = { ...defaultOptions, ...options }

    try {
      const canvas = await this.generateVerseImage(verseText, verseReference, bibleVersionId, shareOptions)
      const blob = await this.canvasToBlob(canvas)

      // Record the share
      await this.recordShare(verseId, verseText, verseReference, bibleVersionId, 'image')

      // Share the image
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'verse.png', { type: 'image/png' })] })) {
        const file = new File([blob], 'verse.png', { type: 'image/png' })
        await navigator.share({
          title: `${verseReference} - Bible Verse`,
          files: [file]
        })
      } else {
        // Fallback: download the image
        this.downloadBlob(blob, `${verseReference.replace(/[^a-zA-Z0-9]/g, '_')}.png`)
      }

      return { success: true, blob }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate verse image'
      }
    }
  }

  /**
   * Get sharing history
   */
  async getShareHistory(): Promise<VerseShare[]> {
    const { data, error } = await supabase
      .from('verse_shares')
      .select('*')
      .order('shared_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data.map(this.transformShare)
  }

  /**
   * Get sharing statistics
   */
  async getShareStats(): Promise<{
    totalShares: number
    textShares: number
    imageShares: number
    recentShares: VerseShare[]
  }> {
    const shares = await this.getShareHistory()

    return {
      totalShares: shares.length,
      textShares: shares.filter(s => s.shareType === 'text').length,
      imageShares: shares.filter(s => s.shareType === 'image').length,
      recentShares: shares.slice(0, 5)
    }
  }

  /**
   * Generate verse image on canvas
   */
  private async generateVerseImage(
    verseText: string,
    verseReference: string,
    bibleVersionId: string,
    options: ShareOptions
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    // Set canvas size (optimized for social media)
    canvas.width = 1080
    canvas.height = 1080

    // Background
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add subtle gradient or pattern based on template
    if (options.template === 'elegant') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, options.backgroundColor)
      gradient.addColorStop(1, this.adjustColor(options.backgroundColor, -20))
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Text styling
    ctx.fillStyle = options.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Main verse text
    const maxWidth = canvas.width * 0.8
    const fontSize = options.fontSize * 2 // Scale for high DPI
    ctx.font = `${fontSize}px ${options.fontFamily}`

    const lines = this.wrapText(ctx, verseText, maxWidth)
    const lineHeight = fontSize * 1.4
    const totalTextHeight = lines.length * lineHeight

    // Center the text vertically
    const startY = (canvas.height - totalTextHeight) / 2

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight))
    })

    // Reference text
    if (options.includeReference) {
      const refFontSize = fontSize * 0.6
      ctx.font = `${refFontSize}px ${options.fontFamily}`
      ctx.fillStyle = this.adjustColor(options.textColor, -30)

      let referenceText = `— ${verseReference}`
      if (options.includeVersion) {
        referenceText += ` (${bibleVersionId})`
      }

      ctx.fillText(referenceText, canvas.width / 2, startY + totalTextHeight + refFontSize)
    }

    // Add app branding (subtle)
    ctx.font = `${fontSize * 0.3}px ${options.fontFamily}`
    ctx.fillStyle = this.adjustColor(options.textColor, -50)
    ctx.fillText('Illumine Bible App', canvas.width / 2, canvas.height - 40)

    return canvas
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * Adjust color brightness
   */
  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  /**
   * Convert canvas to blob
   */
  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      }, 'image/png', 0.9)
    })
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Record a share in the database
   */
  private async recordShare(
    verseId: string,
    verseText: string,
    verseReference: string,
    bibleVersionId: string,
    shareType: 'text' | 'image' | 'link'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('verse_shares')
        .insert({
          verse_id: verseId,
          verse_text: verseText,
          verse_reference: verseReference,
          bible_version_id: bibleVersionId,
          share_type: shareType
        })

      if (error) throw error

      // Update achievements
      await achievementsService.incrementProgress('verses_shared')
    } catch (error) {
      console.warn('Failed to record share:', error)
    }
  }

  /**
   * Transform database record to VerseShare
   */
  private transformShare(data: unknown): VerseShare {
    return {
      id: data.id,
      userId: data.user_id,
      verseId: data.verse_id,
      verseText: data.verse_text,
      verseReference: data.verse_reference,
      bibleVersionId: data.bible_version_id,
      shareType: data.share_type,
      sharedAt: new Date(data.shared_at)
    }
  }
}

export const verseSharingService = new VerseSharingService()
