import useSWR from "swr"
import type { Document, DocumentVersion, DocumentAnalysis } from "@/types/domain/document"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDocument(documentId: string) {
  const { data, error, mutate } = useSWR<{ data: Document }>(
    documentId ? `/api/documents/${documentId}` : null,
    fetcher,
  )

  return {
    document: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export function useDocumentVersions(documentId: string) {
  const { data, error, mutate } = useSWR<{ data: DocumentVersion[] }>(
    documentId ? `/api/documents/${documentId}/versions` : null,
    fetcher,
  )

  return {
    versions: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export function useDocumentAnalyses(documentId: string) {
  const { data, error, mutate } = useSWR<{ data: DocumentAnalysis[] }>(
    documentId ? `/api/documents/${documentId}/analyses` : null,
    fetcher,
  )

  return {
    analyses: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
