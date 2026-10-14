import { Organization, Site, User, ModuleKey } from '../types';

export const CURRENT_ORGANIZATION: Organization = {
  id: '10000000-0000-4000-8000-000000000001',
  code: 'SBMU',
  name: 'دانشگاه علوم پزشکی شهید بهشتی',
  legalTitle: 'دانشگاه علوم پزشکی و خدمات بهداشتی درمانی شهید بهشتی',
  timezone: 'Asia/Tehran',
};

export const SITES_DATA: Site[] = [
  {
    id: '10000000-0000-4000-8000-000000000011',
    orgId: '10000000-0000-4000-8000-000000000001',
    code: 'SITE-TALEGHANI',
    name: 'بیمارستان آیت‌الله طالقانی',
    type: 'hospital',
    typeLabel: 'مرکز آموزشی، پژوهشی و درمانی عمومی',
    activeBeds: 540,
    departmentsCount: 28,
    address: 'تهران، بزرگراه شهید چمران، اوین',
  },
  {
    id: '10000000-0000-4000-8000-000000000012',
    orgId: '10000000-0000-4000-8000-000000000001',
    code: 'SITE-IMAM-HOSSEIN',
    name: 'بیمارستان امام حسین (ع)',
    type: 'hospital',
    typeLabel: 'مرکز تخصصی تروما و جراحی جنرال',
    activeBeds: 620,
    departmentsCount: 32,
    address: 'تهران، خیابان شهید مدنی، نظام‌آباد',
  },
  {
    id: '10000000-0000-4000-8000-000000000013',
    orgId: '10000000-0000-4000-8000-000000000001',
    code: 'SITE-SHOHADA',
    name: 'بیمارستان شهدای تجریش',
    type: 'hospital',
    typeLabel: 'مرکز آنکولوژی، جراحی مغز و اعصاب',
    activeBeds: 480,
    departmentsCount: 24,
    address: 'تهران، میدان تجریش، خیابان شهرداری',
  },
  {
    id: '10000000-0000-4000-8000-000000000014',
    orgId: '10000000-0000-4000-8000-000000000001',
    code: 'SITE-MOFID',
    name: 'مرکز تخصصی کودکان مفید',
    type: 'hospital',
    typeLabel: 'مرکز فوق‌تخصصی اطفال و نوزادان',
    activeBeds: 260,
    departmentsCount: 16,
    address: 'تهران، خیابان شریعتی، بالاتر از حسینیه ارشاد',
  },
  {
    id: '10000000-0000-4000-8000-000000000015',
    orgId: '10000000-0000-4000-8000-000000000001',
    code: 'SITE-HQ',
    name: 'ستاد مرکزی دانشگاه علوم پزشکی',
    type: 'headquarters',
    typeLabel: 'معاونت درمان و حوزه ریاست دانشگاه',
    activeBeds: 0,
    departmentsCount: 8,
    address: 'تهران، بزرگراه شهید چمران، تقاطع یادگار امام',
  },
];

export const DEMO_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'دکتر علیرضا زالی',
    role: 'executive_viewer',
    roleTitle: 'مدیر ارشد و رئیس دانشگاه',
    department: 'حوزه ریاست و معاونت درمان',
    personnelId: '984120',
    email: 'zali@sbmu.ac.ir',
    orgId: CURRENT_ORGANIZATION.id,
    permittedSiteIds: SITES_DATA.map(s => s.id), // All sites
  },
  {
    id: 'usr-2',
    name: 'دکتر حمیدرضا مقصودی',
    role: 'domain_analyst',
    roleTitle: 'مدیر امور بیمارستانی و تخت‌ها',
    department: 'مدیریت درمان بیمارستان طالقانی',
    personnelId: '873214',
    email: 'maghsoudi@sbmu.ac.ir',
    orgId: CURRENT_ORGANIZATION.id,
    permittedSiteIds: ['10000000-0000-4000-8000-000000000011'], // Only Taleghani
  },
  {
    id: 'usr-3',
    name: 'دکتر مریم امینی',
    role: 'process_approver',
    roleTitle: 'مسئول دارویی و تجهیزات مصرفی',
    department: 'داروخانه و زنجیره تأمین امام حسین',
    personnelId: '912045',
    email: 'amini.pharm@sbmu.ac.ir',
    orgId: CURRENT_ORGANIZATION.id,
    permittedSiteIds: ['10000000-0000-4000-8000-000000000012'], // Only Imam Hossein
  },
  {
    id: 'usr-4',
    name: 'مهندس پروانه موسوی',
    role: 'data_steward',
    roleTitle: 'ناظر یکپارچگی داده و قراردادها',
    department: 'مدیریت فناوری اطلاعات و آمار',
    personnelId: '954781',
    email: 'mousavi.it@sbmu.ac.ir',
    orgId: CURRENT_ORGANIZATION.id,
    permittedSiteIds: SITES_DATA.map(s => s.id), // All sites
  },
];

export interface ModuleDefinition {
  key: ModuleKey;
  title: string;
  shortTitle: string;
  description: string;
  badge?: string;
  iconName: string;
  category: 'core' | 'operations' | 'management';
}

export const MODULES_CONFIG: ModuleDefinition[] = [
  {
    key: 'EXE',
    title: 'هوشمندی و تصمیم‌یاری ارشد',
    shortTitle: 'داشبورد مدیریتی',
    description: 'تحلیل شاخص‌های حاکمیتی، مقایسه سایت‌های درمانی و پیش‌نویس تصمیمات',
    iconName: 'LayoutDashboard',
    category: 'core',
  },
  {
    key: 'OPS',
    title: 'عملیات بیمارستانی و جریان بیمار',
    shortTitle: 'مدیریت تخت و اورژانس',
    description: 'پایش ضریب اشغال، ترخیص، اتاق عمل و شلوغی بخش اورژانس',
    iconName: 'Activity',
    category: 'operations',
  },
  {
    key: 'SUP',
    title: 'زنجیره تأمین، دارو و انبار',
    shortTitle: 'زنجیره تأمین و دارو',
    description: 'پیش‌بینی کسری دارویی، مدیریت تاریخ انقضا و حواله‌های انتقالی',
    iconName: 'PackageOpen',
    category: 'operations',
  },
  {
    key: 'QLT',
    title: 'کیفیت، ایمنی و خطاها (CAPA)',
    shortTitle: 'کیفیت و اعتباربخشی',
    description: 'گزارش وقایع ناخواسته، انطباق با استانداردهای اعتباربخشی و نظرسنجی',
    iconName: 'ShieldAlert',
    category: 'operations',
  },
  {
    key: 'AST',
    title: 'تجهیزات پزشکی و مدیریت دارایی‌ها',
    shortTitle: 'تجهیزات پزشکی و CMMS',
    description: 'نرخ آماده‌به‌کاری تجهیزات حیاتی، نگهداری پیشگیرانه و مصرف انرژی',
    iconName: 'Cpu',
    category: 'operations',
  },
  {
    key: 'FIN',
    title: 'مالی، درآمد و تحلیل کسورات',
    shortTitle: 'درآمد و بیمه‌ها',
    description: 'آنالیز کسورات بیمه‌ای، بهای تمام‌شده خدمت و پیش‌بینی جریانات نقدینگی',
    iconName: 'CreditCard',
    category: 'management',
  },
  {
    key: 'DAT',
    title: 'حاکمیت داده و قراردادهای اتصال',
    shortTitle: 'حاکمیت داده (Data Steward)',
    description: 'پایش کانکتورهای HIS/PACS، کشف ناهماهنگی داده و کاتالوگ شاخص‌ها',
    iconName: 'Database',
    category: 'management',
  },
  {
    key: 'PLT',
    title: 'امنیت، دسترسی و پیکربندی سکو',
    shortTitle: 'مدیریت دسترسی و سکو',
    description: 'سیاست‌های جداسازی سایت، ممیزی، کنترل توکن‌ها و وضعیت پایلوت',
    iconName: 'LockKeyhole',
    category: 'management',
  },
];
