/** Frontend-only demonstrator: checks scoped recipients and review binding before a local synthetic publication. */
export function parseDemoRecipients(value: string): string[] {
  return value.split(/[,،]/).map(id => id.trim()).filter(Boolean);
}
export function checkDemoPublicationRecipients(rootValue: string, proposedValue: string, permittedIds: string[]): string[] {
  const root = parseDemoRecipients(rootValue);
  const proposed = parseDemoRecipients(proposedValue);
  const allowed = new Set(permittedIds);
  const issues: string[] = [];
  if (!root.length || !proposed.length) issues.push('فهرست گیرندگان نباید خالی باشد.');
  if (new Set(root).size !== root.length || new Set(proposed).size !== proposed.length) issues.push('گیرنده تکراری مجاز نیست.');
  if (root.some(id => !allowed.has(id)) || proposed.some(id => !allowed.has(id))) issues.push('BLOCKED: گیرنده‌ای خارج از فهرست مجاز همین سایت وجود دارد.');
  if (root.length !== proposed.length || root.some(id => !proposed.includes(id))) issues.push('STALE REVIEW: گیرندگان انتشار با نسخه بررسی‌شده گزارش یکسان نیستند؛ بررسی مستقل جدید لازم است.');
  return issues;
}
