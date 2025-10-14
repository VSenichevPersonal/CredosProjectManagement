import type { DatabaseProvider } from "@/providers/database-provider"
import type { DocumentDiff } from "@/types/domain/document"
import { AppError } from "@/lib/errors"
import { DiffFactory, type DiffProviderType } from "@/lib/providers/diff/diff-factory"
import { StorageService } from "@/lib/services/storage-service"

export class DocumentDiffService {
  constructor(
    private db: DatabaseProvider,
    private providerType: DiffProviderType = "libre",
  ) {}

  async generateDiff(
    userId: string,
    documentId: string,
    fromVersionId: string | null,
    toVersionId: string,
  ): Promise<DocumentDiff> {
    try {
      // Check if diff already exists
      const existing = await this.db.documentDiffs.findByVersions(fromVersionId, toVersionId, "text")

      if (existing) {
        return existing
      }

      // Get versions
      const toVersion = await this.db.documentVersions.findById(toVersionId)
      if (!toVersion) {
        throw new AppError("Target version not found", 404)
      }

      let fromVersion = null
      if (fromVersionId) {
        fromVersion = await this.db.documentVersions.findById(fromVersionId)
        if (!fromVersion) {
          throw new AppError("Source version not found", 404)
        }
      }

      let fromContent: string | null = null
      let toContent: string

      try {
        if (fromVersion?.storagePath) {
          fromContent = await StorageService.downloadFileContent(fromVersion.storagePath)
        }
        toContent = await StorageService.downloadFileContent(toVersion.storagePath)
      } catch (error) {
        console.error("[v0] Failed to download file content:", error)
        // Fallback to placeholder if download fails
        fromContent = fromVersion ? `[Содержимое файла ${fromVersion.fileName} недоступно]` : null
        toContent = `[Содержимое файла ${toVersion.fileName} недоступно]`
      }

      const provider = DiffFactory.create(this.providerType)

      const diffResult = await provider.generateDiff({
        fromContent,
        toContent,
        fromFileName: fromVersion?.fileName,
        toFileName: toVersion.fileName,
      })

      // Create diff record
      const diff = await this.db.documentDiffs.create({
        documentId,
        fromVersionId,
        toVersionId,
        diffType: "text",
        diffData: diffResult.changes,
        diffHtml: diffResult.htmlOutput,
        additionsCount: diffResult.statistics.additions,
        deletionsCount: diffResult.statistics.deletions,
        modificationsCount: diffResult.statistics.modifications,
      })

      return diff
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to generate diff: ${error.message}`, 500)
      }
      throw new AppError("Failed to generate diff", 500)
    }
  }

  async getDiff(
    userId: string,
    fromVersionId: string | null,
    toVersionId: string,
    diffType: "text" | "visual" | "semantic" = "text",
  ): Promise<DocumentDiff | null> {
    try {
      return await this.db.documentDiffs.findByVersions(fromVersionId, toVersionId, diffType)
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`Failed to fetch diff: ${error.message}`, 500)
      }
      throw new AppError("Failed to fetch diff", 500)
    }
  }
}
