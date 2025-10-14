import { createClient } from "@/lib/supabase/server"

/**
 * Ensures the evidence-files bucket exists in Supabase Storage
 * NOTE: Bucket should be created via migration (009_setup_storage_buckets.sql)
 * This function only verifies existence and logs warnings
 */
export async function ensureEvidenceBucket() {
  const supabase = await createClient()

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error("[Storage] Failed to list buckets:", listError)
    throw new Error("Failed to check storage buckets")
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === "evidence-files")

  if (!bucketExists) {
    console.error("[Storage] ❌ evidence-files bucket does not exist!")
    console.error("[Storage] Please run migration: scripts/009_setup_storage_buckets.sql")
    throw new Error("evidence-files bucket not found. Please run migration: scripts/009_setup_storage_buckets.sql")
  }

  console.log("[Storage] ✅ evidence-files bucket exists")
  return true
}
