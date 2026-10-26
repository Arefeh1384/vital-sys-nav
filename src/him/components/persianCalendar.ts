/** Calendar labels are computed for Tehran, never hard-coded or manually shifted. */
export function formatTehranPersianDate(date:Date):string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{
    year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Tehran'
  }).format(date);
}
