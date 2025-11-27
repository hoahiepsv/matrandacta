export interface MatrixRow {
  tt: string | number;
  topic: string;
  content: string;
  assessment_level: string; // "Nhận biết", "Thông hiểu", ...
  recognition_tn: number; // TN = Trắc nghiệm
  recognition_tl: number; // TL = Tự luận
  understanding_tn: number;
  understanding_tl: number;
  application_tn: number;
  application_tl: number;
  high_application_tn: number;
  high_application_tl: number;
  note?: string;
}

export interface MatrixSummary {
  total_recognition: number;
  total_understanding: number;
  total_application: number;
  total_high_application: number;
  percent_recognition: number;
  percent_understanding: number;
  percent_application: number;
  percent_high_application: number;
  general_percent_basic: number; // NB + TH
  general_percent_advanced: number; // VD + VDC
}

export interface MatrixData {
  title: string;
  school_year: string;
  subject: string;
  grade: string;
  time: string;
  rows: MatrixRow[];
  summary: MatrixSummary;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl?: string;
  type: 'matrix_source' | 'template_source';
}

export interface LevelConfig {
  percent: number;
  tn: number;
  tl: number;
}

export interface MatrixConfig {
  recognition: LevelConfig;
  understanding: LevelConfig;
  application: LevelConfig;
  high_application: LevelConfig;
}