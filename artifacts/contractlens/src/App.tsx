import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowUpRight, Bell, CalendarDays, Check, ChevronRight,
  ClipboardCheck, FileSearch, Files, Filter, GitCompare, Inbox, LayoutDashboard, Menu,
  MoreHorizontal, Plus, RefreshCw, Search, ShieldCheck, Upload, X
} from 'lucide-react';
import {
  getGetContractQueryKey, getGetDashboardQueryKey, getListContractsQueryKey,
  useAnalyzeContract, useChatWithContract, useCompareContractVersions, useGetActivity, useGetContract,
  useGetContractObligations, useGetContractReview, useGetContractTimeline, useGetDashboard,
  useListContracts, useResolveReviewItem, useUploadContract, useUploadContractVersion
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

function cx(...parts: Array<string | false | undefined>) { return parts.filter(Boolean).join(' '); }
function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function relativeTime(value?: string) {
  if (!value) return 'Recently';
  const mins = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}
function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
function tone(value?: string) {
  const v = (value || '').toLowerCase();
  if (v.includes('risk') || v.includes('overdue') || v.includes('high') || v.includes('open')) return 'red';
  if (v.includes('review') || v.includes('pending') || v.includes('due')) return 'amber';
  if (v.includes('active') || v.includes('complete') || v.includes('resolved') || v.includes('current')) return 'teal';
  return 'slate';
}

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/contracts', label: 'Contracts', icon: Files },
  { href: '/obligations', label: 'Obligations', icon: ClipboardCheck },
  { href: '/review', label: 'Review queue', icon: Inbox },
  { href: '/activity', label: 'Agent activity', icon: Activity },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  return <div className="shell">
    <aside className={cx('sidebar', mobileOpen && 'mobile-open')}>
      <div className="brand"><div className="brand-mark">CL</div><span>ContractLens</span></div>
      <div className="nav-section eyebrow">Workspace</div>
      <nav className="nav">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cx('nav-link', (href === '/' ? location === '/' : location.startsWith(href)) && 'active')} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-foot">
        <div className="user-row"><div className="avatar">JS</div><div><b style={{ display: 'block', fontSize: 12 }}>Jordan Singh</b><span style={{ color: '#8e9a9c', fontSize: 10 }}>Legal operations</span></div></div>
      </div>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <div className="topbar-title"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation"><Menu /></button> Operations desk <span style={{ margin: '0 7px', color: '#b9b4aa' }}>/</span> {location === '/' ? 'Overview' : location.split('/')[1]?.replace('-', ' ')}</div>
        <div className="top-actions"><button className="icon-btn" aria-label="Search"><Search /></button><button className="icon-btn" aria-label="Notifications" onClick={() => setShowToast(true)}><Bell /></button><Link href="/contracts" className="primary-btn" data-testid="button-upload-contract"><Upload size={14} /> Add contract</Link></div>
      </header>
      <main className="main">{children}</main>
    </section>
    {showToast && <button className="toast-note" onClick={() => setShowToast(false)}>No new notifications</button>}
  </div>;
}

function LoadingPanel() { return <div className="panel loading"><div className="skeleton large" /></div>; }
function ErrorPanel({ retry }: { retry?: () => void }) { return <div className="panel empty"><AlertTriangle size={20} style={{ marginBottom: 10, color: 'hsl(var(--destructive))' }} /><div>We could not load this workspace view.</div>{retry && <button className="ghost-btn" style={{ marginTop: 14 }} onClick={retry}><RefreshCw size={13} /> Try again</button>}</div>; }

function StatCards({ dashboard }: { dashboard: any }) {
  const stats = [
    ['Active contracts', dashboard?.activeContracts ?? 0, 'Across your workspace'],
    ['Obligations due', dashboard?.upcomingObligations ?? 0, 'Next 30 days'],
    ['Needs review', dashboard?.requiresReview ?? 0, 'Human decisions needed'],
    ['Renewals ahead', dashboard?.upcomingRenewals ?? 0, 'Next 90 days'],
  ];
  return <div className="stats">{stats.map(([label, value, note]) => <div className="stat-card" key={String(label)}><div className="stat-label">{label}</div><div className="stat-value" data-testid={`stat-${String(label).toLowerCase().replaceAll(' ', '-')}`}>{value}</div><div className="stat-note">{note}</div></div>)}</div>;
}

function ContractTable({ contracts, compact = false }: { contracts: any[]; compact?: boolean }) {
  if (!contracts?.length) return <div className="empty">No contracts have been added yet.</div>;
  return <div className="panel table-wrap"><table className="table"><thead><tr><th>Agreement</th><th>Status</th><th>Renewal</th><th>Obligations</th><th>Updated</th><th /></tr></thead><tbody>{contracts.slice(0, compact ? 5 : 100).map((c) => <tr key={c.id} data-testid={`row-contract-${c.id}`}><td><Link href={`/contracts/${c.id}`}><span className="contract-name">{c.name}</span><span className="contract-type">{c.type} · {c.parties?.slice(0, 2).join(' / ')}</span></Link></td><td><Badge tone={tone(c.status)}>{c.status}</Badge></td><td><span className={cx('mono', c.daysToRenewal < 60 && 'text-red-700')}>{formatDate(c.renewalDate)}</span><div className="contract-type">{c.daysToRenewal} days</div></td><td><span className="mono">{c.obligationCount}</span>{c.reviewCount > 0 && <span style={{ color: 'hsl(var(--destructive))', fontSize: 10, marginLeft: 7 }}>{c.reviewCount} review</span>}</td><td className="contract-type">{relativeTime(c.updatedAt)}</td><td><Link href={`/contracts/${c.id}`} aria-label={`Open ${c.name}`}><ChevronRight size={15} color="hsl(var(--primary))" /></Link></td></tr>)}</tbody></table></div>;
}

function ActivityList({ items }: { items: any[] }) {
  if (!items?.length) return <div className="empty">Agent activity will appear here as agreements are processed.</div>;
  return <div className="list">{items.map((item) => <div className="activity-item" key={item.id} data-testid={`activity-${item.id}`}><div className="activity-icon">{item.status?.toLowerCase().includes('review') ? <FileSearch /> : <ShieldCheck />}</div><div><div className="activity-message"><b>{item.agent}</b> {item.message}</div><div className="activity-time">{relativeTime(item.timestamp)} {item.status && <span style={{ marginLeft: 8 }}><Badge tone={tone(item.status)}>{item.status}</Badge></span>}</div></div></div>)}</div>;
}

function DeadlineList({ items }: { items: any[] }) {
  if (!items?.length) return <div className="empty">No upcoming deadlines.</div>;
  return <div className="list">{items.slice(0, 6).map((item) => <div className="list-item" key={item.id}><div className={cx('list-mark', item.status?.toLowerCase().includes('overdue') && 'red')} /><div className="list-content"><div className="list-title">{item.title}</div><div className="list-meta"><span className="mono">{formatDate(item.date)}</span> · {item.owner} · {item.type}</div></div><Badge tone={tone(item.status)}>{item.status}</Badge></div>)}</div>;
}

function ReviewList({ items, onResolve }: { items: any[]; onResolve?: (id: number, status: string) => void }) {
  if (!items?.length) return <div className="empty"><Check size={22} style={{ marginBottom: 9, color: 'hsl(var(--primary))' }} /><div>Review queue is clear.</div></div>;
  return <div>{items.map((item) => <div className="review-card" key={item.id} data-testid={`review-${item.id}`}><div className={cx('severity', item.severity?.toLowerCase() === 'medium' && 'medium')} /><div className="review-main"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div className="review-title">{item.issue}</div><Badge tone={tone(item.severity)}>{item.severity}</Badge></div><div className="review-reason">{item.reason}</div><div className="evidence"><FileSearch size={12} /> p.{item.evidence?.page} · {item.evidence?.section}</div><div className="review-actions"><button className="primary-btn" style={{ height: 30, fontSize: 10 }} onClick={() => onResolve?.(item.id, 'resolved')}><Check size={12} /> Resolve</button><button className="ghost-btn" style={{ height: 30, fontSize: 10 }} onClick={() => onResolve?.(item.id, 'ignored')}><X size={12} /> Ignore</button><Link href={`/contracts/${item.contractId}`} className="ghost-btn" style={{ height: 30, fontSize: 10 }}>Open contract <ArrowUpRight size={12} /></Link></div></div></div>)}</div>;
}

function Dashboard() {
  const q = useGetDashboard();
  const d = q.data as any;
  return <><div className="page-head"><div><div className="eyebrow">Sunday, September 20, 2026</div><h1 className="page-title">Hello, Judges.</h1><p className="page-subtitle">Your contract operations desk at a glance.</p></div><Link href="/contracts" className="primary-btn"><Plus size={14} /> New agreement</Link></div>
    {q.isLoading ? <LoadingPanel /> : q.isError ? <ErrorPanel retry={() => q.refetch()} /> : <><StatCards dashboard={d} /><div className="grid-2"><div><div className="panel"><div className="panel-head"><h2 className="panel-title">Active agreements</h2><Link href="/contracts" className="panel-link">View all <ArrowUpRight size={12} style={{ verticalAlign: 'middle' }} /></Link></div><ContractTable contracts={d?.contracts || []} compact /></div><div className="panel full-panel"><div className="panel-head"><h2 className="panel-title">Upcoming deadlines</h2><Link href="/obligations" className="panel-link">Open obligations</Link></div><DeadlineList items={d?.timeline || []} /></div></div><div><div className="panel"><div className="panel-head"><h2 className="panel-title">Human review queue</h2><Link href="/review" className="panel-link">{d?.reviewQueue?.length || 0} items</Link></div><ReviewList items={(d?.reviewQueue || []).slice(0, 3)} /></div><div className="panel full-panel"><div className="panel-head"><h2 className="panel-title">Recent agent activity</h2><Link href="/activity" className="panel-link">See feed</Link></div><ActivityList items={(d?.activity || []).slice(0, 4)} /></div></div></div></>}
  </>;
}

function Contracts() {
  const q = useListContracts();
  const upload = useUploadContract();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filename, setFilename] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const contracts = ((q.data as any[]) || []).filter((c) => `${c.name} ${c.type} ${c.parties?.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const acceptFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please choose a PDF contract.');
      return;
    }
    setUploadError('');
    setFilename(file.name);
  };
  const addContract = () => { if (!filename.trim()) return; upload.mutate({ data: { filename: filename.trim(), versionLabel: 'Initial review', isDemo: true } }, { onSuccess: () => { setFilename(''); setShowForm(false); qc.invalidateQueries({ queryKey: getListContractsQueryKey() }); } }); };
  return <><div className="page-head"><div><div className="eyebrow">Workspace / agreements</div><h1 className="page-title">Contracts</h1><p className="page-subtitle">Every agreement, its operational state, and what needs attention.</p></div><button className="primary-btn" onClick={() => setShowForm(!showForm)}><Upload size={14} /> Upload agreement</button></div>
    {showForm && <div className="panel" style={{ padding: 18, marginBottom: 18 }}><div className="eyebrow">Add agreement</div><div className={cx('dropzone', isDragging && 'dragging')} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); acceptFile(event.dataTransfer.files[0]); }}><Upload size={18} /><div><b>{filename || 'Drop a PDF contract here'}</b><div className="contract-type">or choose a file from your computer</div></div><label className="ghost-btn" style={{ height: 30, fontSize: 10, cursor: 'pointer' }}>Browse<input type="file" accept=".pdf,application/pdf" hidden onChange={(event) => acceptFile(event.target.files?.[0])} /></label></div><div style={{ display: 'flex', gap: 9, marginTop: 10 }}><input className="search" style={{ flex: 1, minWidth: 0, paddingLeft: 12 }} value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="Document filename" data-testid="input-contract-filename" /><button className="primary-btn" onClick={addContract} disabled={upload.isPending || !filename.trim()}>{upload.isPending ? 'Uploading…' : 'Add to workspace'}</button></div>{uploadError && <div className="upload-error">{uploadError}</div>}<div className="contract-type" style={{ marginTop: 8 }}>The agent will extract parties, dates, obligations, and review signals after upload.</div></div>}
    <div className="filters" style={{ marginBottom: 14 }}><div className="search-wrap"><Search /><input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agreements" data-testid="input-search-contracts" /></div><button className="ghost-btn"><Filter size={13} /> All statuses</button><span className="contract-type">{contracts.length} agreements</span></div>
    {q.isLoading ? <LoadingPanel /> : q.isError ? <ErrorPanel retry={() => q.refetch()} /> : <ContractTable contracts={contracts} />}
  </>;
}

function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const q = useGetContract(id, { query: { queryKey: getGetContractQueryKey(id), enabled: Number.isFinite(id) } });
  const detail = q.data as any;
  const analyze = useAnalyzeContract();
  const compare = useCompareContractVersions();
  const uploadVersion = useUploadContractVersion();
  const chat = useChatWithContract();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);
  const runChat = () => { if (!question.trim()) return; chat.mutate({ id, data: { question } }, { onSuccess: (res) => { setAnswer(res); setQuestion(''); } }); };
  if (q.isLoading) return <LoadingPanel />;
  if (q.isError || !detail) return <ErrorPanel retry={() => q.refetch()} />;
  return <><Link href="/contracts" className="panel-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16 }}><ArrowLeft size={13} /> All contracts</Link>
    <div className="detail-hero"><div><div className="eyebrow">Agreement dossier · {detail.versions?.find((v: any) => v.isCurrent)?.label || `Version ${detail.versions?.length || 1}`}</div><h1 className="page-title">{detail.name}</h1><p className="page-subtitle" style={{ color: '#b5bfbd' }}>{detail.type} · {detail.parties?.map((p: any) => p.name).join(' / ')}</p><div className="hero-meta"><div><b>{detail.obligations?.length || 0}</b><span>Obligations</span></div><div><b>{detail.reviews?.length || 0}</b><span>Review items</span></div><div><b>{detail.versions?.length || 1}</b><span>Versions</span></div></div></div><div className="hero-side"><Badge tone={tone(detail.status)}>{detail.status}</Badge><div><button className="primary-btn" onClick={() => analyze.mutate({ id })} disabled={analyze.isPending}>{analyze.isPending ? 'Analyzing…' : 'Run analysis'}</button></div></div></div>
    <div className="detail-grid"><div className="stack"><section className="panel"><div className="panel-head"><h2 className="panel-title">Extracted facts</h2><span className="eyebrow">Source grounded</span></div><div className="fact-grid">{(detail.facts || []).map((fact: any, i: number) => <div className="fact" key={`${fact.label}-${i}`}><div className="fact-label">{fact.label}</div><div className="fact-value">{fact.value}</div><div className="evidence"><FileSearch size={11} /> p.{fact.evidence?.page} · {fact.evidence?.section}</div></div>)}</div></section>
      <section className="panel"><div className="panel-head"><h2 className="panel-title">Obligations</h2><Link href="/obligations" className="panel-link">Cross-contract view</Link></div>{(detail.obligations || []).map((o: any) => <div className="obligation" key={o.id}><div className="obligation-top"><div className="obligation-title">{o.title}</div><Badge tone={tone(o.status)}>{o.status}</Badge></div><div className="obligation-description">{o.description}</div><div className="obligation-foot"><span className="mono">{formatDate(o.dueDate)}</span><span>Owner: {o.owner}</span><span>{Math.round((o.confidence || 0) * 100)}% confidence</span>{o.affectedByChange && <Badge tone="amber">Changed in v2</Badge>}</div></div>)}</section>
      <section className="panel"><div className="panel-head"><h2 className="panel-title">Risk and review</h2><Link href="/review" className="panel-link">Open review queue</Link></div><ReviewList items={detail.reviews || []} /></section>
      <section className="panel"><div className="panel-head"><h2 className="panel-title">Change comparison</h2><button className="ghost-btn" style={{ height: 30, fontSize: 10 }} onClick={() => { setShowCompare(true); compare.mutate({ id }); }}><GitCompare size={13} /> Compare versions</button></div>{showCompare && (compare.data || detail.comparison) && <div style={{ padding: '15px 20px' }}><div className="list-meta">{(compare.data as any)?.summary || detail.comparison?.summary}</div>{((compare.data as any)?.changes || detail.comparison?.changes || []).map((ch: any, i: number) => <div className="fact" key={i}><div className="fact-label">{ch.category} · {ch.label}</div><div style={{ fontSize: 11, marginTop: 6 }}><span style={{ color: '#8d5549' }}>{ch.oldValue}</span> <ChevronRight size={11} style={{ verticalAlign: 'middle' }} /> <span style={{ color: '#286c6d' }}>{ch.newValue}</span></div>{ch.requiresReview && <Badge tone="amber">Review impact</Badge>}</div>)}</div>}{!showCompare && <div className="empty">Compare the current document against its prior version to see downstream obligation impact.</div>}</section>
    </div><div className="stack"><section className="panel"><div className="panel-head"><h2 className="panel-title">Parties</h2><span className="eyebrow">{detail.parties?.length || 0} named</span></div><div className="parties">{(detail.parties || []).map((p: any) => <div className="party" key={p.name}><b>{p.name}</b><span>{p.role}</span></div>)}</div></section>
      <section className="panel"><div className="panel-head"><h2 className="panel-title">Deadline timeline</h2><Link href="/obligations" className="panel-link">View calendar</Link></div><div className="timeline">{(detail.deadlines || []).map((d: any) => <div className="timeline-row" key={d.id}><div className="timeline-dot" /><div><div className="timeline-date">{formatDate(d.date)} · {d.type}</div><div className="timeline-title">{d.title}</div><div className="list-meta">{d.owner} · <Badge tone={tone(d.status)}>{d.status}</Badge></div></div></div>)}</div></section>
      <section className="panel"><div className="panel-head"><h2 className="panel-title">Source evidence</h2><span className="eyebrow">Document passages</span></div><div className="list">{(detail.facts || []).slice(0, 5).map((fact: any, i: number) => <div className="list-item" key={`${fact.label}-${i}`}><div className="list-mark teal" /><div className="list-content"><div className="list-title">{fact.evidence?.section || fact.label}</div><div className="list-meta">Page {fact.evidence?.page} · {fact.evidence?.sourceType}</div><div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 5, color: 'hsl(var(--muted-foreground))' }}>{fact.evidence?.excerpt}</div></div></div>)}</div></section>
      <section className="panel chat"><div className="panel-head"><h2 className="panel-title">Grounded assistant</h2><span className="eyebrow"><ShieldCheck size={11} style={{ verticalAlign: 'middle' }} /> Evidence only</span></div><div className="chat-body">{answer ? <><div className="chat-q">You asked: {answer.question}</div><div className="chat-answer">{answer.answer}</div><div className="evidence" style={{ marginTop: 12 }}><FileSearch size={11} /> {answer.evidence?.length || 0} source passages · {Math.round((answer.confidence || 0) * 100)}% confidence</div></> : <div className="empty" style={{ padding: '28px 10px' }}>Ask about renewal terms, responsibilities, or a clause. Answers stay tied to the source document.</div>}</div><div className="chat-form"><input className="chat-input" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runChat()} placeholder="Ask about this agreement" data-testid="input-contract-question" /><button className="primary-btn" style={{ width: 38, padding: 0 }} onClick={runChat} disabled={chat.isPending} aria-label="Ask assistant"><ArrowUpRight size={15} /></button></div></section>
      <section className="panel"><div className="panel-head"><h2 className="panel-title">Document versions</h2><button className="ghost-btn" style={{ height: 30, fontSize: 10 }} onClick={() => uploadVersion.mutate({ id, data: { filename: `new-version-${Date.now()}.pdf`, versionLabel: `v${(detail.versions?.length || 1) + 1}` } })}><Plus size={12} /> Add version</button></div>{(detail.versions || []).map((v: any) => <div className="version-row" key={v.id}><div><div className="version-label">{v.label} {v.isCurrent && <Badge tone="teal">Current</Badge>}</div><div className="version-file">{v.filename} · {formatDate(v.uploadedAt)}</div></div><MoreHorizontal size={15} color="hsl(var(--muted-foreground))" /></div>)}</section>
    </div></div>
  </>;
}

function Obligations() {
  const contractsQ = useListContracts();
  const contracts = (contractsQ.data as any[]) || [];
  const [contractId, setContractId] = useState<number | null>(null);
  const chosen = contractId || contracts[0]?.id;
  const q = useGetContractObligations(Number(chosen), { query: { queryKey: ['/api/contracts', chosen, 'obligations'], enabled: !!chosen } });
  const timeline = useGetContractTimeline(Number(chosen), { query: { queryKey: ['/api/contracts', chosen, 'timeline'], enabled: !!chosen } });
  const [view, setView] = useState<'obligations' | 'deadlines'>('obligations');
  return <><div className="page-head"><div><div className="eyebrow">Workspace / operations</div><h1 className="page-title">Obligations</h1><p className="page-subtitle">A practical view of what your agreements require next.</p></div><div className="filters"><select className="ghost-btn" value={chosen || ''} onChange={(e) => setContractId(Number(e.target.value))} data-testid="select-obligation-contract">{contracts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
    <div className="filters" style={{ marginBottom: 14 }}><button className={cx('ghost-btn', view === 'obligations' && 'primary-btn')} onClick={() => setView('obligations')}><ClipboardCheck size={13} /> Obligations</button><button className={cx('ghost-btn', view === 'deadlines' && 'primary-btn')} onClick={() => setView('deadlines')}><CalendarDays size={13} /> Deadlines</button></div>
    <div className="panel"><div className="panel-head"><h2 className="panel-title">{view === 'obligations' ? 'Contract obligations' : 'Contract deadline view'}</h2><span className="eyebrow">{view === 'obligations' ? `${(q.data as any[])?.length || 0} tracked` : `${(timeline.data as any[])?.length || 0} dates`}</span></div>{view === 'obligations' ? <div>{(q.data as any[])?.map((o: any) => <div className="obligation" key={o.id}><div className="obligation-top"><div className="obligation-title">{o.title}</div><Badge tone={tone(o.status)}>{o.status}</Badge></div><div className="obligation-description">{o.description}</div><div className="obligation-foot"><span className="mono">{formatDate(o.dueDate)}</span><span>Owner: {o.owner}</span><span>{o.recurrence || 'One-time'}</span><span>{Math.round((o.confidence || 0) * 100)}% confidence</span></div></div>) || <div className="empty">Select a contract to see obligations.</div>}</div> : <DeadlineList items={(timeline.data as any[]) || []} />}</div>
  </>;
}

function Review() {
  const contractsQ = useListContracts();
  const [selected, setSelected] = useState<number | null>(null);
  const chosen = selected || (contractsQ.data as any[])?.[0]?.id;
  const q = useGetContractReview(Number(chosen), { query: { queryKey: ['/api/contracts', chosen, 'review'], enabled: !!chosen } });
  const resolve = useResolveReviewItem();
  const qc = useQueryClient();
  const resolveItem = (id: number, status: string) => resolve.mutate({ id, data: { status } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/contracts', chosen, 'review'] }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } });
  return <><div className="page-head"><div><div className="eyebrow">Workspace / human decisions</div><h1 className="page-title">Review queue</h1><p className="page-subtitle">Agent findings that need a qualified human before they become operational truth.</p></div><div className="filters"><select className="ghost-btn" value={chosen || ''} onChange={(e) => setSelected(Number(e.target.value))} data-testid="select-review-contract">{(contractsQ.data as any[] || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><div className="panel"><div className="panel-head"><h2 className="panel-title">Open findings</h2><span className="eyebrow">{(q.data as any[])?.length || 0} awaiting decision</span></div><ReviewList items={(q.data as any[]) || []} onResolve={resolveItem} /></div></>;
}

function ActivityPage() { const q = useGetActivity(); const items = q.data as any[]; return <><div className="page-head"><div><div className="eyebrow">Workspace / audit trail</div><h1 className="page-title">Agent activity</h1><p className="page-subtitle">A transparent record of every extraction, comparison, and recommendation.</p></div><button className="ghost-btn" onClick={() => q.refetch()}><RefreshCw size={13} /> Refresh feed</button></div><div className="panel"><div className="panel-head"><h2 className="panel-title">Activity feed</h2><span className="eyebrow">Latest first</span></div>{q.isLoading ? <div className="empty">Loading activity…</div> : q.isError ? <ErrorPanel retry={() => q.refetch()} /> : <ActivityList items={items || []} />}</div></>; }

function Router() { return <ErrorBoundary resetKey={location.pathname}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/contracts" component={Contracts} /><Route path="/contracts/:id" component={ContractDetailPage} /><Route path="/obligations" component={Obligations} /><Route path="/review" component={Review} /><Route path="/activity" component={ActivityPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>; }
export default function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>; }