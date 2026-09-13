<script lang="ts">
 export let name='book';
 export let size=24;
 const paths:Record<string,string>={
  plus:'M12 5v14M5 12h14', close:'m6 6 12 12M18 6 6 18', search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  arrow:'M4 12h16m-6-6 6 6-6 6', back:'M20 12H4m6-6-6 6 6 6', external:'M14 4h6v6m0-6L10 14M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4',
  book:'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1m0-15c4-3 8-2 10-1v15c-4-2-7-1-10 1V5',
  bookmark:'M6 3h12v18l-6-4-6 4V3', check:'m5 12 4 4L19 6', chevron:'m7 10 5 5 5-5',
  sliders:'M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6',
  refresh:'M20 7V3m0 4h-4M4 17v4m0-4h4M5 7a8 8 0 0 1 14-2l1 2M4 17l1 2a8 8 0 0 0 14-2',
  settings:'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3',
  edit:'m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  link:'m10 14 4-4m-7 5-1 1a4 4 0 0 0 6 6l4-4a4 4 0 0 0 0-6M17 9l1-1a4 4 0 0 0-6-6L8 6a4 4 0 0 0 0 6',
  folder:'M3 5h6l2 3h10v12H3V5', trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11', heart:'M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13',
  info:'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', sort:'M8 4v16m-4-4 4 4 4-4M16 20V4m-4 4 4-4 4 4'
 };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name]||paths.book}/></svg>
