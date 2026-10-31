export async function GET() {
  const files = import.meta.glob('/src/content/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const parts: string[] = [
    '# u64.cam — full content (llms-full.txt)',
    '',
    "Concatenated markdown sources of u64.cam, the personal site of Cameron Durham.",
    'Generated at build time. Index and courtesy links: https://u64.cam/llms.txt',
    "Part of a transparent agent-traffic measurement experiment: fetching this file is https://u64.cam-visible in server analytics.",
    '',
  ];

  for (const path of Object.keys(files).sort()) {
    parts.push(`\n\n<!-- source: ${path} -->\n`);
    parts.push(files[path]);
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
