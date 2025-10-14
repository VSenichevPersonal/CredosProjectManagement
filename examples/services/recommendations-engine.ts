/**
 * RecommendationsEngine Service
 * 
 * Generates recommendations based on configurable rules and dashboard metrics
 * Stage 14.4 - Executive Summary
 */

import type { 
  RecommendationRule, 
  Recommendation, 
  DashboardMetrics,
  ConditionOperator 
} from "@/types/domain/recommendation"

export class RecommendationsEngine {
  /**
   * Generate recommendations based on rules and metrics
   */
  static generateRecommendations(
    rules: RecommendationRule[],
    metrics: DashboardMetrics
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Evaluate each active rule
    const activeRules = rules.filter(rule => rule.isActive)
    
    for (const rule of activeRules) {
      const shouldTrigger = this.evaluateCondition(rule, metrics)
      
      if (shouldTrigger) {
        const recommendation = this.buildRecommendation(rule, metrics)
        recommendations.push(recommendation)
      }
    }

    // Sort by priority (critical first) and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    }).slice(0, 5) // Top 5 recommendations
  }

  /**
   * Evaluate if rule condition is met
   */
  private static evaluateCondition(
    rule: RecommendationRule,
    metrics: DashboardMetrics
  ): boolean {
    const fieldValue = this.getMetricValue(rule.conditionField, metrics)
    
    if (fieldValue === null || fieldValue === undefined) {
      return false
    }

    return this.compareValues(
      fieldValue,
      rule.conditionOperator,
      rule.conditionValue
    )
  }

  /**
   * Get metric value by field name
   */
  private static getMetricValue(
    fieldName: string,
    metrics: DashboardMetrics
  ): number | null {
    // Map field names to metrics
    const fieldMap: Record<string, number> = {
      'overallCompletionRate': metrics.overallCompletionRate,
      'criticalCompletionRate': metrics.criticalCompletionRate,
      'overdueCount': metrics.overdueCount,
      'evidenceCoverage': metrics.evidenceCoverage,
      'orgsWithoutResponsible': metrics.orgsWithoutResponsible,
      'fstecCompletionRate': metrics.fstecCompletionRate,
      'fsbCompletionRate': metrics.fsbCompletionRate,
      'roskomnadzorCompletionRate': metrics.roskomnadzorCompletionRate,
      'currentRiskAssessments': metrics.currentRiskAssessments,
      'notStartedCount': metrics.notStartedCount,
      'totalRequirements': metrics.totalRequirements,
    }

    return fieldMap[fieldName] ?? null
  }

  /**
   * Compare values using operator
   */
  private static compareValues(
    actual: number,
    operator: ConditionOperator,
    threshold: number
  ): boolean {
    switch (operator) {
      case '<': return actual < threshold
      case '>': return actual > threshold
      case '<=': return actual <= threshold
      case '>=': return actual >= threshold
      case '==': return actual === threshold
      case '!=': return actual !== threshold
      default: return false
    }
  }

  /**
   * Build recommendation from rule and metrics
   */
  private static buildRecommendation(
    rule: RecommendationRule,
    metrics: DashboardMetrics
  ): Recommendation {
    const currentValue = this.getMetricValue(rule.conditionField, metrics)
    
    // Replace placeholders in templates
    const title = this.replacePlaceholders(rule.titleTemplate, metrics)
    const description = this.replacePlaceholders(rule.descriptionTemplate, metrics)
    const action = this.replacePlaceholders(rule.actionTemplate, metrics)

    // Format budget
    const estimatedBudget = this.formatBudget(
      rule.estimatedBudgetMin,
      rule.estimatedBudgetMax
    )

    // Format deadline
    const deadline = rule.deadlineDays 
      ? `${rule.deadlineDays} ${this.pluralizeDays(rule.deadlineDays)}`
      : null

    // Get affected organizations
    const affectedOrganizations = this.getAffectedOrganizations(rule, metrics)

    // Calculate confidence (0-100)
    const confidence = this.calculateConfidence(rule, metrics, currentValue)

    return {
      id: `rec-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      priority: rule.priority,
      category: rule.category,
      title,
      description,
      action,
      deadline,
      deadlineDays: rule.deadlineDays,
      estimatedBudget,
      legalBasis: rule.legalBasis,
      affectedOrganizations,
      affectedCount: affectedOrganizations.length,
      currentValue: currentValue ?? undefined,
      thresholdValue: rule.conditionValue,
      isActionable: true,
      confidence,
    }
  }

  /**
   * Replace placeholders in template string
   */
  private static replacePlaceholders(
    template: string,
    metrics: DashboardMetrics
  ): string {
    let result = template

    // Replace metric placeholders
    const placeholders: Record<string, string | number> = {
      '{overallCompletionRate}': Math.round(metrics.overallCompletionRate),
      '{criticalCompletionRate}': Math.round(metrics.criticalCompletionRate),
      '{overdueCount}': metrics.overdueCount,
      '{evidenceCoverage}': Math.round(metrics.evidenceCoverage),
      '{orgsWithoutResponsible}': metrics.orgsWithoutResponsible,
      '{fstecCompletionRate}': Math.round(metrics.fstecCompletionRate),
      '{fsbCompletionRate}': Math.round(metrics.fsbCompletionRate),
      '{roskomnadzorCompletionRate}': Math.round(metrics.roskomnadzorCompletionRate),
      '{totalOrganizations}': metrics.totalOrganizations,
      '{totalRequirements}': metrics.totalRequirements,
    }

    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    }

    // Replace budget placeholder
    result = result.replace(
      '{estimatedBudget}',
      this.formatBudget(null, null) // Will be replaced later
    )

    return result
  }

  /**
   * Format budget range
   */
  private static formatBudget(min: number | null, max: number | null): string | null {
    if (!min && !max) return null
    if (!max) return `от ${this.formatNumber(min)} руб.`
    if (!min) return `до ${this.formatNumber(max)} руб.`
    return `${this.formatNumber(min)}-${this.formatNumber(max)} руб.`
  }

  /**
   * Format number with spaces
   */
  private static formatNumber(num: number | null): string {
    if (num === null) return '0'
    return num.toLocaleString('ru-RU')
  }

  /**
   * Pluralize days
   */
  private static pluralizeDays(count: number): string {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'дней'
    }

    if (lastDigit === 1) return 'день'
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
    return 'дней'
  }

  /**
   * Get affected organizations for recommendation
   */
  private static getAffectedOrganizations(
    rule: RecommendationRule,
    metrics: DashboardMetrics
  ): string[] {
    // Return weak organizations for most rules
    if (rule.category === 'critical_requirements' || 
        rule.category === 'evidence_coverage' ||
        rule.category === 'regulator_performance') {
      return metrics.weakOrganizations.map(org => org.name)
    }

    return []
  }

  /**
   * Calculate confidence in recommendation
   */
  private static calculateConfidence(
    rule: RecommendationRule,
    metrics: DashboardMetrics,
    currentValue: number | null
  ): number {
    if (currentValue === null) return 50

    // Base confidence on how far we are from threshold
    const threshold = rule.conditionValue
    const difference = Math.abs(currentValue - threshold)
    const relativeDistance = difference / threshold

    // More distance = higher confidence
    if (relativeDistance > 0.5) return 100
    if (relativeDistance > 0.3) return 90
    if (relativeDistance > 0.2) return 80
    if (relativeDistance > 0.1) return 70
    return 60
  }

  /**
   * Calculate dashboard metrics from raw data
   */
  static calculateMetrics(data: {
    requirements: any[]
    compliance: any[]
    organizations: any[]
    measures: any[]
    evidence: any[]
    evidenceLinks: any[]
    risks: any[]
  }): DashboardMetrics {
    const {
      requirements,
      compliance,
      organizations,
      measures,
      evidence,
      evidenceLinks,
      risks
    } = data

    // Overall completion
    const compliantCount = compliance.filter(c => c.status === 'compliant').length
    const overallCompletionRate = requirements.length > 0 
      ? (compliantCount / requirements.length) * 100 
      : 0

    // Critical requirements
    const criticalReqs = requirements.filter(r => r.criticality === 'critical')
    const criticalCompliant = compliance.filter(c => 
      c.status === 'compliant' && 
      criticalReqs.some(r => r.id === c.requirement_id)
    ).length
    const criticalCompletionRate = criticalReqs.length > 0
      ? (criticalCompliant / criticalReqs.length) * 100
      : 0

    // Overdue
    const overdueCount = compliance.filter(c => c.status === 'non_compliant').length

    // Evidence coverage
    const measuresWithEvidence = measures.filter(m => 
      evidenceLinks.some(link => link.control_measure_id === m.id)
    ).length
    const evidenceCoverage = measures.length > 0
      ? (measuresWithEvidence / measures.length) * 100
      : 0

    // Organizations without responsible
    const orgsWithoutResponsible = organizations.filter(org => 
      !org.responsible_person_id
    ).length

    // Regulator performance
    const calculateRegulatorRate = (regulatorName: string) => {
      const regulatorReqs = requirements.filter(r => 
        r.regulator === regulatorName || r.regulatory_framework?.name?.includes(regulatorName)
      )
      const regulatorCompliant = compliance.filter(c =>
        c.status === 'compliant' &&
        regulatorReqs.some(r => r.id === c.requirement_id)
      ).length
      return regulatorReqs.length > 0 
        ? (regulatorCompliant / regulatorReqs.length) * 100 
        : 100
    }

    const fstecCompletionRate = calculateRegulatorRate('ФСТЭК')
    const fsbCompletionRate = calculateRegulatorRate('ФСБ')
    const roskomnadzorCompletionRate = calculateRegulatorRate('Роскомнадзор')

    // Weak organizations
    const weakOrganizations = organizations
      .map(org => {
        const orgCompliance = compliance.filter(c => c.organization_id === org.id)
        const orgCompliant = orgCompliance.filter(c => c.status === 'compliant').length
        const completionRate = orgCompliance.length > 0
          ? (orgCompliant / orgCompliance.length) * 100
          : 0
        return { id: org.id, name: org.name, completionRate }
      })
      .filter(org => org.completionRate < 70)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5)

    return {
      overallCompletionRate,
      criticalCompletionRate,
      totalRequirements: requirements.length,
      totalOrganizations: organizations.length,
      compliantCount,
      inProgressCount: compliance.filter(c => c.status === 'in_progress').length,
      notStartedCount: compliance.filter(c => c.status === 'not_started').length,
      overdueCount,
      evidenceCoverage,
      totalEvidence: evidence.length,
      evidenceWithLinks: evidenceLinks.length,
      fstecCompletionRate,
      fsbCompletionRate,
      roskomnadzorCompletionRate,
      orgsWithoutResponsible,
      weakOrganizations,
      currentRiskAssessments: risks.length,
      criticalRisks: risks.filter(r => r.risk_level === 'critical').length,
      highRisks: risks.filter(r => r.risk_level === 'high').length,
      lastMonthCompletedCount: 0, // TODO: calculate from dates
      lastMonthTrend: 0, // TODO: calculate trend
    }
  }
}

