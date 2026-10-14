export type RoleCode = 
  | 'executive_viewer'
  | 'domain_analyst'
  | 'process_approver'
  | 'control_approver'
  | 'data_steward'
  | 'integration_administrator'
  | 'security_administrator';

export interface User {
  id: string;
  name: string;
  role: RoleCode;
  roleTitle: string;
  department: string;
  personnelId: string;
  email: string;
  orgId: string;
  permittedSiteIds: string[];
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  legalTitle: string;
  timezone: string;
}

export type SiteType = 'hospital' | 'headquarters' | 'clinic' | 'center';

export interface Site {
  id: string;
  orgId: string;
  code: string;
  name: string;
  type: SiteType;
  typeLabel: string;
  activeBeds?: number;
  departmentsCount?: number;
  address: string;
}

export interface Scope {
  orgId: string;
  orgName: string;
  siteId: string | null;
  siteName: string;
  siteCode?: string;
  siteType?: SiteType;
}

export type ModuleKey = 
  | 'EXE' // داشبورد مدیریتی
  | 'OPS' // عملیات و تخت‌ها
  | 'SUP' // زنجیره تأمین و دارو
  | 'QLT' // کیفیت و ایمنی بالینی
  | 'AST' // دارایی‌ها و تجهیزات
  | 'FIN' // مالی و درآمد
  | 'DAT' // حاکمیت داده و قراردادها
  | 'PLT'; // امنیت و تنظیمات پایه

export type ViewState = 'normal' | 'loading' | 'empty' | 'error';
