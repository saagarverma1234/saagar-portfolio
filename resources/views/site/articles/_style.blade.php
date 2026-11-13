{{-- Article styles. Kept inside the page body so they work with any version of site.layout. --}}
<style>
.post { --acc: var(--gold, var(--accent, #ffcc66)); --acc2: #4fb3e8; --pan: var(--panel, var(--surface, #15161d)); max-width: 700px; margin: 0 auto; }
.post p, .post li { font-size: 18px; line-height: 1.7; }
.post .crumbs { font-size: 15px; margin: 0 0 14px; }
.post .crumbs a { text-decoration: none; }
.post h1 { margin-bottom: 10px; }
.post .meta { font-size: 14px; color: var(--dim); margin: 0 0 20px; }
.post .lede { font-size: 19px; line-height: 1.6; color: var(--muted); }
.post h2 { margin-top: 38px; }
.post .fig { margin: 22px 0 24px; padding: 14px 12px 10px; background: var(--pan); border: 1px solid var(--line); border-radius: 14px; }
.post .fig svg { display: block; width: 100%; max-width: 560px; height: auto; margin: 0 auto; }
.post .fig figcaption { font-size: 14px; line-height: 1.5; color: var(--dim); margin-top: 8px; padding: 0 4px; }
.post .fig text { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; fill: var(--muted); }
.post .fig .t-strong { fill: var(--text); font-weight: 600; }
.post .fig .t-acc { fill: var(--acc); }
.post .fig .t-acc2 { fill: var(--acc2); }
.post .fig .ln { stroke: var(--dim); fill: none; }
.post .fig .ln-soft { stroke: var(--line); fill: none; }
.post .fig .acc { stroke: var(--acc); fill: none; }
.post .fig .acc2 { stroke: var(--acc2); fill: none; }
.post .fig .f-acc { fill: var(--acc); }
.post .fig .f-acc2 { fill: var(--acc2); }
.post .fig .f-dim { fill: var(--dim); }
.post .fig .f-pan { fill: var(--bg, #0b0c10); }
.post .eq { font: 16px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--pan); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; overflow-x: auto; white-space: nowrap; margin: 0 0 16px; }
.post .note { background: var(--pan); border: 1px solid var(--line); border-left: 3px solid var(--acc); border-radius: 12px; padding: 14px 16px; margin: 20px 0; }
.post .note p:last-child { margin-bottom: 0; }
.post .try { display: block; background: var(--pan); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; margin: 30px 0 10px; }
.post .try p { margin: 0 0 12px; }
.post .try .go { display: inline-flex; align-items: center; min-height: 46px; padding: 0 20px; border-radius: 999px; background: var(--acc); color: #1a1406; font-weight: 700; text-decoration: none; margin: 0 8px 8px 0; }
.post .try .go.alt { background: transparent; color: var(--link); border: 1px solid var(--line); }
.post .sources { padding-left: 22px; }
.post .sources li { font-size: 15px; line-height: 1.55; color: var(--muted); margin-bottom: 10px; }
.post .tbl { overflow-x: auto; margin: 6px 0 18px; border: 1px solid var(--line); border-radius: 12px; }
.post .tbl table { width: 100%; border-collapse: collapse; font-size: 16px; line-height: 1.45; margin: 0; display: table; }
.post .tbl th, .post .tbl td { text-align: left; border-bottom: 1px solid var(--line); padding: 9px 12px; }
.post .tbl tr:last-child td { border-bottom: 0; }
.post .tbl th { color: var(--muted); font-weight: 600; background: var(--pan); }
.post .tbl td.n, .post .tbl th.n { text-align: right; font-variant-numeric: tabular-nums; }
.more-articles { max-width: 700px; margin: 34px auto 0; border-top: 1px solid var(--line); padding-top: 18px; }
.more-articles h2 { font-size: 18px; margin: 0 0 10px; }
.more-articles ul { list-style: none; padding: 0; margin: 0; }
.more-articles li { margin: 0 0 10px; font-size: 17px; }
.art-list { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 14px; }
@media (min-width: 720px) { .art-list { grid-template-columns: 1fr 1fr; } }
.art-card { display: flex; flex-direction: column; height: 100%; background: var(--panel, var(--surface, #15161d)); border: 1px solid var(--line); border-radius: 14px; padding: 18px; text-decoration: none; color: var(--text); }
.art-card:hover { border-color: var(--dim); }
.art-card .k { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; }
.art-card h2 { font-size: 20px; line-height: 1.3; margin: 0 0 8px; color: var(--text); }
.art-card p { color: var(--muted); margin: 0 0 12px; font-size: 16px; line-height: 1.55; flex: 1; }
.art-card .rt { font-size: 14px; color: var(--link); }
</style>
