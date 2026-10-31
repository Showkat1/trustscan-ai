export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InvestigationStatus = "queued" | "running" | "completed" | "failed";

export type InputType = "message" | "url" | "screenshot" | "document";

export type StageStatus = "pending" | "running" | "completed" | "skipped" | "failed";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RiskSignal {
  name: string;
  severity: RiskLevel;
  explanation: string;
}

export interface EvidenceReference {
  source: string;
  excerpt: string;
  relevance: string;
}

export interface Claim {
  claim: string;
  verification_status:
    | "verified"
    | "contradicted"
    | "requires_verification"
    | "unknown";
  supporting_evidence: string[];
  evidence_references: EvidenceReference[];
}

export interface Entity {
  entity_type: string;
  value: string;
}

export interface InvestigationAnalysis {
  threat_category: string;
  intent: string[];
  entities: Entity[];
  claims: Claim[];
  risk_signals: RiskSignal[];
  summary: string;
}

export interface ExtractedEvidence {
  urls: string[];
  phone_numbers: string[];
  emails: string[];
  money_amounts: string[];
  organizations: string[];
  requests: string[];
  risk_indicators: string[];
  categories: string[];
}

export interface URLIntelligenceResult {
  url: string;
  valid: boolean;
  error: string | null;
  hostname: string;
  registered_domain: string;
  scheme: string;
  port: number | null;
  is_https: boolean;
  is_ip_address: boolean;
  is_url_shortener: boolean;
  contains_at_symbol: boolean;
  contains_punycode: boolean;
  subdomain_count: number;
  suspicious_keywords: string[];
  query_parameters: string[];
  brand_mentions: string[];
  brand_domain_mismatches: string[];
  risk_indicators: string[];
  assessment: string;
}

export interface CorrelationPattern {
  name: string;
  severity: RiskLevel;
  explanation: string;
  evidence: string[];
}

export interface EvidenceRelationship {
  source: string;
  relationship: string;
  target: string;
}

export interface CorrelationResult {
  evidence_signals: string[];
  correlations: CorrelationPattern[];
  correlation_score: number;
  correlation_level: string;
  relationships: EvidenceRelationship[];
  narrative: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  explanation: string;
}

export interface RetrievedSource {
  source: string;
  title: string;
  text: string;
  score: number;
  document_id: string | null;
}

export interface PipelineStage {
  key: string;
  label: string;
  status: StageStatus;
  duration_ms: number | null;
  detail: string | null;
}

export interface InvestigationReport {
  text_excerpt: string;
  extracted: ExtractedEvidence;
  urls: URLIntelligenceResult[];
  analysis: InvestigationAnalysis;
  correlation: CorrelationResult;
  risk: RiskAssessment;
  actions: string[];
  sources: RetrievedSource[];
  stages: PipelineStage[];
  analysis_mode: string;
  notes: string[];
  generated_at: string | null;
}

export interface InvestigationListItem {
  id: string;
  input_type: InputType;
  status: InvestigationStatus;
  risk_score: number | null;
  risk_level: string | null;
  threat_category: string | null;
  correlation_level: string | null;
  analysis_mode: string | null;
  input_excerpt: string | null;
  created_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface InvestigationDetail extends InvestigationListItem {
  stage: string;
  stage_index: number;
  error_message: string | null;
  file_name: string | null;
  report: InvestigationReport | null;
}

export interface InvestigationPage {
  items: InvestigationListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface RiskDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface OverviewStats {
  total: number;
  completed: number;
  running: number;
  failed: number;
  high_risk: number;
  critical_risk: number;
  average_score: number;
  last_7_days: number;
  risk_distribution: RiskDistribution;
  input_type_distribution: Record<string, number>;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  category: string;
  chunk_count: number;
  created_at: string;
}

export interface KnowledgeChunk {
  id: string;
  chunk_index: number;
  content: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocument {
  content: string;
  chunks: KnowledgeChunk[];
}

export interface KnowledgeSearchHit {
  document_id: string;
  title: string;
  source: string;
  text: string;
  score: number;
}

export interface KnowledgeSearchResponse {
  query: string;
  hits: KnowledgeSearchHit[];
}

export interface PipelineStageMeta {
  key: string;
  label: string;
}

export interface RiskBand {
  level: RiskLevel;
  min: number;
  max: number;
}

export interface SystemMeta {
  app_name: string;
  version: string;
  pipeline: PipelineStageMeta[];
  input_types: InputType[];
  risk_bands: RiskBand[];
  llm_mode: string;
  embedding_provider: string;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}
