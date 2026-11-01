export type MarkdownSources = Record<string, string>;

export function contentSourcePath(collection: string, id: string): string {
  return `/src/content/${collection}/${id}.md`;
}

export function buildLlmsFullDocument(
  files: MarkdownSources,
  publicPaths: ReadonlySet<string>,
): string {
  const parts = [
    '# u64.cam — full content (llms-full.txt)',
    '',
    'Concatenated public markdown sources of u64.cam, the personal site of Cameron Durham.',
    'Generated at build time. Index and courtesy links: https://u64.cam/llms.txt',
    'Part of a transparent agent-traffic measurement experiment: requests for this file are visible in server analytics.',
    '',
  ];

  for (const path of [...publicPaths].sort()) {
    const source = files[path];
    if (source === undefined) {
      throw new Error(`Public llms-full source was not imported: ${path}`);
    }

    parts.push(`\n\n<!-- source: ${path} -->\n`);
    parts.push(source);
  }

  return parts.join('\n');
}
