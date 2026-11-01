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

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export type DeviceSignalSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO"
  | "GOOD";

export type DeviceSignalCategory =
  | "transport"
  | "privacy"
  | "permissions"
  | "integrity"
  | "environment";

export interface DeviceScreen {
  width: number;
  height: number;
  pixel_ratio: number;
  color_depth: number;
  viewport_width: number;
  viewport_height: number;
}

export interface DeviceHardware {
  cpu_cores: number | null;
  memory_gb: number | null;
  max_touch_points: number;
  plugins: number;
  audio_inputs: number;
  audio_outputs: number;
  video_inputs: number;
}

export interface DeviceConnection {
  effective_type: string | null;
  downlink_mbps: number | null;
  rtt_ms: number | null;
  save_data: boolean;
}

export interface DeviceBattery {
  charging: boolean | null;
  level: number | null;
}

export interface DevicePrivacy {
  do_not_track: boolean;
  global_privacy_control: boolean;
  webdriver: boolean;
}

export interface DeviceContext {
  secure: boolean;
  hostname: string | null;
  protocol: string | null;
}

export interface DeviceStorage {
  local_storage: boolean;
  session_storage: boolean;
  indexed_db: boolean;
}

export interface DeviceWebRtc {
  supported: boolean;
  local_addresses: string[];
  public_addresses: string[];
}

export interface DevicePermissions {
  camera: PermissionState;
  microphone: PermissionState;
  geolocation: PermissionState;
  notifications: PermissionState;
  clipboard_read: PermissionState;
}

export interface DeviceSnapshot {
  platform: string | null;
  browser: string | null;
  browser_version: string | null;
  user_agent: string | null;
  language: string | null;
  languages: string[];
  timezone: string | null;
  timezone_offset: number | null;
  screen: DeviceScreen;
  hardware: DeviceHardware;
  connection: DeviceConnection;
  battery: DeviceBattery;
  privacy: DevicePrivacy;
  context: DeviceContext;
  storage: DeviceStorage;
  webrtc: DeviceWebRtc;
  permissions: DevicePermissions;
  cookies_enabled: boolean;
  collected_at: string | null;
}

export interface DeviceSignal {
  key: string;
  label: string;
  severity: DeviceSignalSeverity;
  points: number;
  detail: string;
  category: DeviceSignalCategory;
}

export interface DeviceRecommendation {
  title: string;
  detail: string;
  priority: "now" | "soon" | "info";
}

export interface DeviceScanListItem {
  id: string;
  label: string | null;
  score: number;
  level: string;
  summary: string;
  platform: string | null;
  browser: string | null;
  created_at: string;
}

export interface DeviceScanDetail extends DeviceScanListItem {
  user_agent: string | null;
  signals: DeviceSignal[];
  recommendations: DeviceRecommendation[];
  metrics: DeviceSnapshot;
}

export interface DeviceScanPage {
  items: DeviceScanListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}
