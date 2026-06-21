/* ------------------------------------------------------------------ */
/*  Envelope                                                          */
/* ------------------------------------------------------------------ */

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
}

export interface Envelope<T> {
  data: T
  meta?: PaginationMeta
}

/* ------------------------------------------------------------------ */
/*  Registry                                                          */
/* ------------------------------------------------------------------ */

export type RegistryType = 'dockerhub' | 'gitlab' | 'ecr' | 'gcr' | 'ghcr' | 'acr' | 'generic'

export interface RegistryRow {
  id: string
  name: string
  type: RegistryType
  url: string
  credentials_set: boolean
  created_at: string
  updated_at: string
}

export interface CreateRegistryPayload {
  name: string
  type: RegistryType
  url: string
  credentials?: Record<string, string>
}

export type UpdateRegistryPayload = Partial<CreateRegistryPayload>

export interface SyncRegistryResult {
  synced_images: number
  repositories_seen: number
}

/* ------------------------------------------------------------------ */
/*  Image                                                             */
/* ------------------------------------------------------------------ */

export interface ImageRow {
  id: string
  registry_id: string
  repository: string
  tag: string
  digest: string
  first_seen_at: string
  last_seen_at: string
}

export interface ImageDetail {
  id: string
  registry_id: string
  repository: string
  tag: string
  digest: string
  registry_url: string
  first_seen_at: string
  last_seen_at: string
  latest_scan_id: string | null
  latest_scan_status: ScanStatus | null
  latest_scan_started_at: string | null
  latest_scan_completed_at: string | null
}

/* ------------------------------------------------------------------ */
/*  Scan                                                              */
/* ------------------------------------------------------------------ */

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ScanDetail {
  id: string
  image_id: string
  status: ScanStatus
  triggered_by: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  trivy_version: string | null
  repository: string
  tag: string
  severity_counts: SeverityCounts
}

export interface SeverityCounts {
  critical: number
  high: number
  medium: number
  low: number
  unknown: number
}

export interface ScanRow {
  id: string
  image_id: string
  status: ScanStatus
  triggered_by: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  trivy_version: string | null
  repository: string
  tag: string
  severity_counts: SeverityCounts
}

export interface CreateScanPayload {
  image_id?: string
  image_ref?: string
}

/* ------------------------------------------------------------------ */
/*  Findings                                                          */
/* ------------------------------------------------------------------ */

export interface FindingListRow {
  id: string
  vulnerability_id: string
  package_name: string
  installed_version: string
  fixed_version: string
  severity: string
  title: string
  created_at: string
}

export interface KnownExploit {
  source: string
  url: string
  description: string
}

export interface FindingDetail {
  id: string
  scan_id: string
  vulnerability_id: string
  package_name: string
  installed_version: string
  fixed_version: string
  severity: string
  title: string
  description: string
  data_source: string
  created_at: string
  kev_listed: boolean
  exploit_exists: boolean
  epss_score: number | null
  epss_percentile: number | null
  risk_score: number | null
  kev_date_added: string | null
  known_exploits: KnownExploit[] | null
  enriched_at: string | null
  image: {
    repository: string
    tag: string
  }
}

/* ------------------------------------------------------------------ */
/*  Packages                                                          */
/* ------------------------------------------------------------------ */

export interface PackageRow {
  name: string
  version: string
  type: string
  layer_digest: string
  licenses: string[]
  file_path: string
}

/* ------------------------------------------------------------------ */
/*  Misconfigurations                                                 */
/* ------------------------------------------------------------------ */

export interface MisconfigRow {
  type: string
  check_id: string
  title: string
  severity: string
  file_path: string
  description: string
  resolution: string
  start_line: number
  end_line: number
}

/* ------------------------------------------------------------------ */
/*  Secrets                                                           */
/* ------------------------------------------------------------------ */

export interface SecretRow {
  rule_id: string
  category: string
  severity: string
  title: string
  file_path: string
  match_text: string
  start_line: number
  end_line: number
  layer_digest: string
}

/* ------------------------------------------------------------------ */
/*  Suppressions                                                      */
/* ------------------------------------------------------------------ */

export interface SuppressionRow {
  id: string
  cve_id: string | null
  pkg_name: string | null
  image_id: string | null
  reason: string
  accepted_by: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateSuppressionPayload {
  cve_id?: string
  pkg_name?: string
  image_id?: string
  reason: string
  expires_at?: string
}

export interface UpdateSuppressionPayload {
  reason?: string
  expires_at?: string
}

/* ------------------------------------------------------------------ */
/*  Dashboard & Reports                                               */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  total_images: number
  total_scans: number
  total_findings: number
  by_severity: SeverityCounts
}

export interface GlobalCVERow {
  vulnerability_id: string
  severity: string
  occurrences: number
  title?: string
  risk_score: number | null
  last_seen: string
}

export interface VulnerabilityReportRow {
  vulnerability_id: string
  severity: string
  occurrences: number
  title?: string
  last_seen: string
}

export interface CVEImageSummary {
  image_id: string
  repository: string
  tag: string
  fixed_version?: string
}

export interface CVEDetail {
  vulnerability_id: string
  title: string
  description: string
  severity: string
  occurrences: number
  risk_score: number | null
  cvss_v3_score: number | null
  epss_score: number | null
  epss_percentile: number | null
  kev_listed: boolean
  kev_date_added: string | null
  exploit_exists: boolean
  data_sources: string[]
  affected_images: CVEImageSummary[]
  last_seen: string
}

/* ------------------------------------------------------------------ */
/*  Query params                                                      */
/* ------------------------------------------------------------------ */

export interface PaginationParams {
  page?: number
  per_page?: number
}

export interface FindingsParams extends PaginationParams {
  severity?: string
  package_name?: string
  sort?: 'severity' | 'package_name' | 'created_at'
}

export interface CVEListParams extends PaginationParams {
  severity?: string
  sort_by?: 'occurrences' | 'risk_score' | 'severity'
}

export interface ReportParams extends PaginationParams {
  severity?: string
  from?: string
  to?: string
}

/* ------------------------------------------------------------------ */
/*  Targets (monitoring)                                                */
/* ------------------------------------------------------------------ */

export interface TargetRow {
  id: string
  image_id: string
  scan_frequency: string
  latest_scan_id: string | null
  latest_scan_status: ScanStatus | null
  created_at: string
  updated_at: string
  repository: string
  tag: string
  registry_url: string
  registry_name: string
}

export interface CreateTargetPayload {
  image_id: string
  scan_frequency?: string
}

