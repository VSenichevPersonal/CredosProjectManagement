/**
 * Bulk sync control measures for all existing compliance records
 * Usage: npx tsx scripts/bulk-sync-measures.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Please set:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ComplianceRecord {
  id: string
  requirement_id: string
  organization_id: string
  requirements: {
    code: string
    title: string
    suggested_control_measure_template_ids: string[]
  }
}

async function syncAllMeasures() {
  console.log('🔄 Bulk Sync Control Measures')
  console.log('=' .repeat(80))
  console.log()

  try {
    // Step 1: Get all compliance records with requirements
    console.log('📋 Fetching compliance records...')
    const { data: records, error: fetchError } = await supabase
      .from('compliance_records')
      .select(`
        id,
        requirement_id,
        organization_id,
        requirements!inner (
          code,
          title,
          suggested_control_measure_template_ids
        )
      `)

    if (fetchError) {
      throw new Error(`Failed to fetch compliance records: ${fetchError.message}`)
    }

    if (!records || records.length === 0) {
      console.log('ℹ️  No compliance records found')
      return
    }

    console.log(`✅ Found ${records.length} compliance records\n`)

    // Step 2: Filter records that need measures
    console.log('🔍 Checking which records need measures...')
    
    const recordsNeedingMeasures: ComplianceRecord[] = []
    
    for (const record of records as any[]) {
      const req = record.requirements
      
      if (!req.suggested_control_measure_template_ids || 
          req.suggested_control_measure_template_ids.length === 0) {
        continue
      }

      // Check if measures already exist
      const { data: existingMeasures } = await supabase
        .from('control_measures')
        .select('id')
        .eq('compliance_record_id', record.id)

      if (!existingMeasures || existingMeasures.length === 0) {
        recordsNeedingMeasures.push(record as ComplianceRecord)
      }
    }

    console.log(`📊 Found ${recordsNeedingMeasures.length} records needing measures\n`)

    if (recordsNeedingMeasures.length === 0) {
      console.log('✨ All compliance records already have measures!')
      return
    }

    // Step 3: Create measures for each record
    console.log('🚀 Creating measures...')
    console.log('-'.repeat(80))

    let successCount = 0
    let errorCount = 0
    let totalMeasuresCreated = 0

    for (let i = 0; i < recordsNeedingMeasures.length; i++) {
      const record = recordsNeedingMeasures[i]
      const progress = `[${i + 1}/${recordsNeedingMeasures.length}]`
      
      console.log(`${progress} Processing: ${record.requirements.code}`)
      console.log(`    Requirement: ${record.requirements.title}`)
      console.log(`    Templates: ${record.requirements.suggested_control_measure_template_ids.length}`)

      try {
        // Create measures from templates
        let createdForRecord = 0
        
        for (const templateId of record.requirements.suggested_control_measure_template_ids) {
          try {
            // Get template
            const { data: template, error: templateError } = await supabase
              .from('control_measure_templates')
              .select('*')
              .eq('id', templateId)
              .single()

            if (templateError || !template) {
              console.log(`    ⚠️  Template not found: ${templateId}`)
              continue
            }

            // Create measure
            const { error: insertError } = await supabase
              .from('control_measures')
              .insert({
                compliance_record_id: record.id,
                requirement_id: record.requirement_id,
                organization_id: record.organization_id,
                template_id: templateId,
                title: template.title,
                description: template.description,
                implementation_notes: template.implementation_guide,
                status: 'planned',
                from_template: true,
                is_locked: false,
              })

            if (insertError) {
              console.log(`    ❌ Error creating measure: ${insertError.message}`)
              errorCount++
            } else {
              createdForRecord++
            }
          } catch (err: any) {
            console.log(`    ❌ Error: ${err.message}`)
            errorCount++
          }
        }

        if (createdForRecord > 0) {
          console.log(`    ✅ Created ${createdForRecord} measures`)
          successCount++
          totalMeasuresCreated += createdForRecord
        }
      } catch (error: any) {
        console.log(`    ❌ Failed: ${error.message}`)
        errorCount++
      }

      console.log()
    }

    // Summary
    console.log('=' .repeat(80))
    console.log('📊 Summary:')
    console.log()
    console.log(`✅ Successfully processed: ${successCount} compliance records`)
    console.log(`📝 Total measures created: ${totalMeasuresCreated}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log()
    console.log('🎉 Sync complete!')
    console.log('=' .repeat(80))

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run the sync
syncAllMeasures().catch(console.error)

