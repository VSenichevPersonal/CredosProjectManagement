-- Check if control_measures have allowed_evidence_type_ids

SELECT 
  cm.id,
  cm.title,
  cm.template_id,
  cm.allowed_evidence_type_ids,
  array_length(cm.allowed_evidence_type_ids, 1) as types_count,
  cmt.title as template_title,
  cmt.recommended_evidence_type_ids,
  array_length(cmt.recommended_evidence_type_ids, 1) as template_types_count
FROM control_measures cm
LEFT JOIN control_measure_templates cmt ON cmt.id = cm.template_id
WHERE cm.compliance_record_id = 'c0918a1c-3d35-4f91-a857-bf03e5c8bd16'
LIMIT 10;

