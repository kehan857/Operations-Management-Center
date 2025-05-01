/**
 * 通用搜索组件相关类型定义
 */

// 搜索字段配置类型
export interface SearchField {
  label: string;
  value: string;
}

// 筛选条件配置类型
export interface FilterConfig {
  type: 'date' | 'dateRange' | 'select' | 'numberRange' | 'input';
  label: string;
  field: string;
  span?: number;
  placeholder?: string | string[];
  options?: Array<{ label: string; value: string | number }>;
  mode?: 'multiple' | 'tags';
}

// 快捷筛选条件类型
export interface QuickFilter {
  label: string;
  value: Record<string, any>;
  color?: string;
}

// 排序选项类型
export interface SortOption {
  label: string;
  value: string;
}

// 搜索结果类型
export interface SearchResult {
  field: string;
  value: string;
  advancedFilters: Record<string, any> | null;
}

// 筛选结果类型
export interface FilterResult {
  [key: string]: any;
  sortBy: string;
}

// Agent表单数据类型
export interface AgentFormData {
  name: string;
  type: string;
  industry: string;
  description: string;
  knowledgeBases: string[];
  dataCapabilities: string[];
  apis: Array<{ name: string; url: string }>;
  temperature: number;
  maxTokens: number;
  allowedSystems: string;
  allowedVersions: string[];
  model: string;
  businessDomain: string;
}

// 指标表单数据类型
export interface MetricFormData {
  businessDomain: string[];
  name: string;
  code: string;
  metricType: string[];
  description: string;
  structureType: string;
  dataSource: string;
  aggregateFunction: string;
  dimensions: string[];
  compositeMetrics: string[];
  derivedFormula: string;
  unit: string;
  frequency: string;
  timeGranularity: string;
  dataQualityRules: Array<{
    type: string;
    rule: string;
  }>;
  tags: string[];
  owner: string;
  [key: string]: any; // 允许动态属性
}

// 搜索建议数据来源类型
export type SuggestionSource = string[] | ((query: string, field: string) => Promise<string[]>); 