# ماتریس پیگیری انطباق فرانت‌اند HIM-OS — نسخه ۱.۲

مبنای این فهرست: سند کارفرما در ۲۶ سپتامبر ۲۰۲۶ و گزارش ۵۰ یافته Momentic در ۲۶ اکتبر ۲۰۲۶؛ وضعیت‌ها بر اساس بازسازی سورس ارسالی قبلی و Patchهای موفق اعلام‌شده توسط کاربر تخمین زده شده و **قبول نهایی نیستند**.

**معیار قبولی:** هر آیتم تنها با مسیر فعال، داده/قید درست، رفتارهای مثبت و منفی، حفظ وضعیت، تفکیک سایت/نقش، و نتیجه آزمون مستند تکمیل تلقی می‌شود. سبز شدن Build و ۵۹ تست فعلی به‌تنهایی قبول مشخصات نیست.

## محدودیت دامنه

کارفرما صراحتاً مستند v1.2 را مشخصات محصول کامل توصیف می‌کند، نه کد اجراشده. این سند شامل ۱۵۶ REQ/TEST و ۵۲ تست قراردادی، هفت زیرحالت و ۱۲ سفر سرتاسری است. گزارش Mo نمونه‌محور و دارای ۵۰ یافته است، بنابراین فقدان یافته، اثبات انطباق دیگر بندها نیست.

## وضعیت ۵۰ یافته

| # | حوزه | یافته | وضعیت فعلی |
|---:|---|---|---|
| 1 | AST | AST sidebar opens KPI-only summary instead of required asset, maintenance, spare and facilities workflows | نیازمند پیاده‌سازی کامل/بازبینی |
| 2 | CTL | Alert details omit required assign/suppress workflow and state timeline | ناقص یا رفع‌نشده |
| 3 | CTL | Alert queue omits owner/rule/detection filters and freshness/escalation information | نیازمند پیاده‌سازی کامل/بازبینی |
| 4 | CTL | Alert resolution bypasses mandatory reason code and evidence/comment | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 5 | AIM/EXE | Completed Copilot turn offers no Run Inspector or run provenance/call-budget details | نیازمند پیاده‌سازی کامل/بازبینی |
| 6 | CTL | Completed task can be reopened without mandatory reason | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 7 | AIM/EXE | Copilot answers last-complete-day question with today's occupancy without clarification | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 8 | AIM/EXE | Copilot feedback cannot target individual claims in an evidence-backed answer | ناقص یا رفع‌نشده |
| 9 | DAT | Data Steward module displays only four summary cards with no connector list, configuration, or lifecycle controls | نیازمند پیاده‌سازی کامل/بازبینی |
| 10 | DAT | Data Steward module only displays static summary cards; lineage card click has no drilldown and sub-routes redirect to dashboard | نیازمند پیاده‌سازی کامل/بازبینی |
| 11 | FIN | FIN sidebar opens KPI-only summary instead of required FIN-01–05 financial workflows | نیازمند پیاده‌سازی کامل/بازبینی |
| 12 | CTL | Insurance denial alert evidence repeats 7.8% without defining rate or showing its adjudicated cohort | ناقص یا رفع‌نشده |
| 13 | KNO | Knowledge document repository and search routes redirect to executive dashboard, and stewardship workspace lacks document repository UI | نیازمند پیاده‌سازی کامل/بازبینی |
| 14 | AIM/EXE | Navigating to /assistant loads the executive dashboard instead of the Copilot workspace | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 15 | PLT/Other | Navigating to /audit displays the executive dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 16 | PLT/Other | Navigating to /clinical/capabilities redirects/falls back to executive dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 17 | PLT/Other | Navigating to /executive/briefs redirects to the Executive dashboard without showing any Brief Builder interface | نیازمند پیاده‌سازی کامل/بازبینی |
| 18 | PLT/Other | Navigating to /executive/investigations redirects to the Executive dashboard without any investigation workspace | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 19 | MLO | Navigating to /models/annotations loads the executive dashboard instead of the model annotation page | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 20 | MLO | Navigating to /models/evaluations displays the executive dashboard instead of a model evaluation screen | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 21 | MLO | Navigating to /models/jobs-and-releases loads the executive dashboard instead of the training jobs/releases page | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 22 | MLO | Navigating to /models/use-cases renders the executive dashboard instead of the model use-case registry | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 23 | PLT/Other | Navigating to /settings/access opens the executive dashboard instead of access settings | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 24 | PLT/Other | Navigating to /settings/agents redirects or loads the executive dashboard instead of Agent Studio | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 25 | PLT/Other | Navigating to /settings/alert-rules displays the executive dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 26 | PLT/Other | Navigating to /settings/source-actions redirects to executive dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 27 | PLT/Other | Navigating to /work-queues redirects to the executive dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 28 | PLT/Other | Navigation sidebar lacks a WFM (workforce management) module entry | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 29 | OPS | Operations board lacks as-of snapshot timestamp and physical/licensed/staffed/blocked/available/occupied capacity breakdown | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 30 | OPS | Operations forecast request/results and forecast-review workspace are missing | نیازمند پیاده‌سازی کامل/بازبینی |
| 31 | OPS | Operations lacks mandated ED, operating-room and laboratory analytical workbenches | نیازمند پیاده‌سازی کامل/بازبینی |
| 32 | QLT | QLT quality indicators omit required numerator, denominator, cohort, exclusions and freshness | ناقص یا رفع‌نشده |
| 33 | QLT | QLT sidebar opens KPI-only summary instead of required FS-QLT-01–06 quality workflows | نیازمند پیاده‌سازی کامل/بازبینی |
| 34 | AIM/EXE | Refreshing during a Copilot run silently cancels it instead of reconnecting to the admitted turn | نیازمند پیاده‌سازی کامل/بازبینی |
| 35 | PLT/Other | Required module activation/settings screen redirects to dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 36 | OPS | Required operational capacity Scenario Lab frontend is missing (/operations/scenarios opens executive dashboard) | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 37 | MLO | Required training-dataset frontend missing: /models/datasets opens executive dashboard | مسیر/پوسته در اصلاحیه‌های قبلی؛ انطباق کامل بررسی‌نشده |
| 38 | SUP | Shortage case does not display its newly created follow-up task | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 39 | PLT/Other | Source-action approval review omits freshness and immutable evidence/policy bindings | ناقص یا رفع‌نشده |
| 40 | KNO | Stewardship workspace has no quality-rule definition, versioning or approval UI | نیازمند پیاده‌سازی کامل/بازبینی |
| 41 | PLT/Other | Succeeded action has no compensation proposal workflow or irreversibility guidance | ناقص یا رفع‌نشده |
| 42 | SUP | Supply risk queue omits required location, category, formulary and risk-horizon filters | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 43 | PLT/Other | Switching to zero-capacity Central Demo leaves populated ward metrics under that site's heading | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 44 | CTL | Task queue omits required page size selector and filter reset controls | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 45 | CTL | Task reassignment accepts and persists an arbitrary nonexistent owner | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 46 | CTL | Task search filter is lost on browser Back from task detail | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 47 | CTL | Task status immediately updates to blocked and saves before required blocker reason and review date are entered | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 48 | SUP | Transfer recommendation feasibility omits storage, cold-chain and release prerequisite evidence | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 49 | SUP | Unknown supplier price prevents saving a nonbinding transfer draft | اصلاح جزئی قبلی؛ نیازمند آزمون پذیرش |
| 50 | SUP | Withdrawing supply recommendation after verified manual execution shows no investigation guidance on manual record | اصلاح تازه آماده؛ هنوز بررسی نشده |

## کارهای باقی‌مانده با اهمیت بالا

1. **کنترل و ایمنی:** واگذاری/سرکوب هشدار و وضعیت تاریخی آن، شواهد ثابت و معتبر تأیید اقدامات، Audit واقعی/صرفاً نما، مجوزهای نقش و دامنه.
2. **اتصال فرایندها:** بازپس‌گیری پیشنهاد پس از اجرای دستی، جبران/عدم‌برگشت‌پذیری اقدام، بازیابی اجرای Copilot پس از Refresh و بازخورد سطح ادعا.
3. **ماژول‌های هدف:** تکمیل گردش‌کارهای AST، FIN، QLT، WFM، DAT، MLO و KNO، به‌جای صفحه صرف.
4. **OPS و SUP:** ظرفیت‌های تفکیکی با Snapshot معتبر، ED/OR/Lab، پیش‌بینی و Scenario Lab با خروجی نامعتبر/ناموجود، قیود انتقال، فیلترها.
5. **سطح کل سند:** تکمیل ماتریس ۱۵۶ REQ/TEST و ۱۲ سناریوی E2E، بررسی موبایل، RTL، دسترس‌پذیری، صفحه‌بندی، دوره‌های زمانی و داده کهنه، مجوز و نقش مستقل.

## مرزهای ایمنی و صداقت

- این نسخه صرفاً نمونه Frontend با داده مصنوعی است، نه راه‌اندازی بالینی یا اتصال به سامانه بیمارستان.
- برای داده ناموجود، وضعیت «نامشخص / شواهد ناکافی / غیرفعال» نمایش داده شود؛ صورت/مخرج، تاریخ Snapshot، نتیجه مدل یا نتیجه منبع را اختراع نکنید.
- مجوز واقعی، Audit امضاشده، اجرا/بازگردانی عملیات در سیستم منبع، آموزش مدل و تأیید بالینی با رابط نمایشی اثبات نمی‌شوند.
- وضعیت‌های Mo تغییر نکرده‌اند و بازآزمایی Mo مجاز/اجرا نشده است.

## اصلاحیه همین نوبت

هشدار پس‌گرفتن نسخه جدیدتر پیشنهاد Supply در صفحه اجرای دستی، برای پرونده دارای گزارش اجرا اضافه شده است؛ اثر/شواهد و وضعیت تأییدشده قدیمی حفظ می‌شوند. هشدار در تب تاریخچه به‌عنوان «هشدار مشتق‌شده» مشخص می‌شود، نه رخداد ثبت‌شده و غیرقابل‌تغییر ممیزی. این یک اصلاح جزئی از یافته شماره ۵۰ است.