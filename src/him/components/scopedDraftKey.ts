/** Browser-local synthetic namespace. Never replaces server-side authorization. */
export const scopedDraftKey = (area: string, path: string, siteId: string, userId: string) =>
  `${area}:${path}:${siteId}:${userId}`;
