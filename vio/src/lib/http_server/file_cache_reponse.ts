export function checkResponse304(
  stat: { mtime: Date },
  reqHeaders: Headers,
  resHeaders: Record<string, string>,
): Response | undefined {
  if (stat.mtime) {
    const lastModified = reqHeaders.get("If-Modified-Since");
    if (lastModified) {
      stat.mtime.setMilliseconds(0);
      const reqMtime = new Date(lastModified).getTime();
      if (reqMtime >= stat.mtime.getTime()) return new Response(null, { status: 304, headers: resHeaders });
    }
  }
}
