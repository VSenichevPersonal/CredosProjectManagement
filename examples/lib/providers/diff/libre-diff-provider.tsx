/**
 * @intent: Libre (open-source) diff implementation using diff-match-patch
 * @architecture: Default provider - no external dependencies
 */

import type { DiffProvider, DiffResult } from "./diff-provider.interface"
import type { DiffChange } from "@/types/domain/document"

export class LibreDiffProvider implements DiffProvider {
  name = "libre"

  async generateDiff(params: {
    fromContent: string | null
    toContent: string
    fromFileName?: string
    toFileName?: string
  }): Promise<DiffResult> {
    const { fromContent, toContent } = params

    // Import diff-match-patch dynamically
    const DiffMatchPatch = (await import("diff-match-patch")).default
    const dmp = new DiffMatchPatch()

    // Generate diffs
    const diffs = dmp.diff_main(fromContent || "", toContent)
    dmp.diff_cleanupSemantic(diffs)

    // Convert to our DiffChange format
    const changes: DiffChange[] = []
    let lineNumber = 1
    let currentLine = ""

    for (const [operation, text] of diffs) {
      const lines = text.split("\n")

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const isLastLine = i === lines.length - 1

        if (operation === 0) {
          // Equal - no change
          currentLine += line
          if (!isLastLine) {
            lineNumber++
            currentLine = ""
          }
        } else if (operation === 1) {
          // Addition
          changes.push({
            type: "add",
            lineNumber,
            content: line,
          })
          if (!isLastLine) {
            lineNumber++
          }
        } else if (operation === -1) {
          // Deletion
          changes.push({
            type: "delete",
            lineNumber,
            content: line,
            oldContent: line,
          })
          if (!isLastLine) {
            lineNumber++
          }
        }
      }
    }

    // Generate HTML output
    const htmlOutput = this.generateHtml(diffs)

    // Calculate statistics
    const statistics = {
      additions: changes.filter((c) => c.type === "add").length,
      deletions: changes.filter((c) => c.type === "delete").length,
      modifications: changes.filter((c) => c.type === "modify").length,
    }

    return {
      changes,
      htmlOutput,
      statistics,
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await import("diff-match-patch")
      return true
    } catch {
      return false
    }
  }

  private generateHtml(diffs: Array<[number, string]>): string {
    let html = '<div class="diff-container">'

    for (const [operation, text] of diffs) {
      const escapedText = this.escapeHtml(text)

      if (operation === 0) {
        // Equal
        html += `<span class="diff-equal">${escapedText}</span>`
      } else if (operation === 1) {
        // Addition
        html += `<span class="diff-add">${escapedText}</span>`
      } else if (operation === -1) {
        // Deletion
        html += `<span class="diff-delete">${escapedText}</span>`
      }
    }

    html += "</div>"
    return html
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br/>")
  }
}
