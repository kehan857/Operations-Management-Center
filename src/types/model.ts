/**
 * 数据模型管理相关类型定义
 */

// 数据模型字段类型
export interface ModelField {
  name: string;
  type: string;
  description: string;
  metricMapping?: string;
  exceptionHandling?: string;
  specialScenarios?: string;
}

// 数据模型类型
export interface DataModel {
  id?: number;
  name: string;
  businessDomain: string[];
  modelType: string;
  description: string;
  fields: ModelField[];
  fieldCount?: number;
  mappedMetrics?: number;
}

// 预建模型类型
export interface PrebuiltModel {
  id: number;
  name: string;
  description: string;
  type: string;
  category: string;
  applicableScenarios: string;
  version: string;
  updateTime: string;
  fields: Array<{
    name: string;
    type: string;
    description: string;
  }>;
} 