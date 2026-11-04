import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Inbox,
  Mail,
  MailPlus,
  RefreshCw,
  Reply,
  Send,
  Server,
  ShieldCheck,
  Unplug,
  X,
} from 'lucide-react';
import {
  getGetAdminMailboxQueryKey,
  getGetAdminMailboxMessageQueryKey,
  getListAdminMailboxMessagesQueryKey,
  useConnectAdminMailbox,
  useDisconnectAdminMailbox,
  useGetAdminMailbox,
  useGetAdminMailboxMessage,
  useListAdminMailboxMessages,
  useSendAdminMailboxMessage,
  type AdminMailboxConnectInput,
  type AdminMailboxMessageSummary,
  type AdminMailboxSendInput,
} from '@workspace/api-client-react';

type ComposerMode = 'new' | 'reply';

function errorText(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

function formatDate(date: string | null | undefined, includeTime = false): string {
  if (!date) return 'Date unavailable';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: includeTime ? 'numeric' : undefined,
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(parsed);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '—';
}

function Label({ children }: { children: string }) {
  return <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#68728a]">{children}</span>;
}

function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      disabled={disabled}
      data-testid={testId}
      className="h-11 w-full rounded-[2px] border border-[#d9deea] bg-[#fbfcfe] px-3.5 text-sm text-[#1a2238] outline-none transition-colors placeholder:text-[#a3aaba] focus:border-[#3150bb] focus:ring-2 focus:ring-[#dce4ff] disabled:opacity-60"
    />
  );
}

function Notice({ tone, children }: { tone: 'success' | 'error' | 'info'; children: ReactNode }) {
  const toneStyle = {
    success: 'border-[#c8e2d3] bg-[#f2fbf5] text-[#32734d]',
    error: 'border-[#efc9c7] bg-[#fff5f3] text-[#9d4d49]',
    info: 'border-[#dce3f1] bg-[#f5f7fc] text-[#53617c]',
  }[tone];
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? Check : CircleHelp;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-5 ${toneStyle}`}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function MailboxSkeleton() {
  return (
    <div className="grid min-h-[520px] animate-pulse overflow-hidden rounded-[3px] border border-[#dfe3eb] bg-[#fffefe] lg:grid-cols-[310px_1fr]">
      <div className="border-b border-[#e7e9ee] p-5 lg:border-b-0 lg:border-r">
        <div className="h-10 w-3/4 bg-[#edf0f6]" />
        <div className="mt-7 space-y-3">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-[74px] bg-[#f2f4f8]" />)}</div>
      </div>
      <div className="p-7">
        <div className="h-4 w-28 bg-[#edf0f6]" />
        <div className="mt-5 h-8 w-2/3 bg-[#edf0f6]" />
        <div className="mt-10 space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-4 w-full bg-[#f2f4f8]" />)}</div>
      </div>
    </div>
  );
}

export default function AdminEmail() {
  const queryClient = useQueryClient();
  const mailboxQuery = useGetAdminMailbox();
  const mailbox = mailboxQuery.data;
  const connected = mailbox?.connected === true;
  const messagesParams = { limit: 30 };
  const messageListQuery = useListAdminMailboxMessages(messagesParams, {
    query: {
      enabled: connected,
      queryKey: getListAdminMailboxMessagesQueryKey(messagesParams),
      staleTime: 30_000,
    },
  });
  const messages = useMemo(() => messageListQuery.data?.messages ?? [], [messageListQuery.data?.messages]);

  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [composerMode, setComposerMode] = useState<ComposerMode | null>(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyToUid, setReplyToUid] = useState<number | undefined>();
  const [connectEmail, setConnectEmail] = useState('');
  const [connectPassword, setConnectPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('465');
  const [successMessage, setSuccessMessage] = useState('');

  const detailQuery = useGetAdminMailboxMessage(selectedUid ?? 0, {
    query: {
      enabled: connected && selectedUid !== null,
      queryKey: getGetAdminMailboxMessageQueryKey(selectedUid ?? 0),
      staleTime: 30_000,
    },
  });

  useEffect(() => {
    if (!selectedUid && messages.length > 0) setSelectedUid(messages[0].uid);
    if (selectedUid && messages.length > 0 && !messages.some((item) => item.uid === selectedUid)) {
      setSelectedUid(messages[0].uid);
    }
    if (!messages.length && !messageListQuery.isLoading) setSelectedUid(null);
  }, [messages, selectedUid, messageListQuery.isLoading]);

  useEffect(() => {
    if (mailbox?.connected) {
      setConnectEmail(mailbox.email ?? '');
      setImapHost(mailbox.imapHost ?? '');
      setImapPort(String(mailbox.imapPort ?? 993));
      setSmtpHost(mailbox.smtpHost ?? '');
      setSmtpPort(String(mailbox.smtpPort ?? 465));
    }
  }, [mailbox?.connected, mailbox?.email, mailbox?.imapHost, mailbox?.imapPort, mailbox?.smtpHost, mailbox?.smtpPort]);

  useEffect(() => {
    if (mailbox?.connected) return;
    const domain = connectEmail.trim().split('@')[1]?.toLowerCase();
    if (!domain || !domain.includes('.')) return;
    setImapHost(`mail.${domain}`);
    setSmtpHost(`mail.${domain}`);
  }, [connectEmail, mailbox?.connected]);

  const connect = useConnectAdminMailbox();
  const disconnect = useDisconnectAdminMailbox();
  const send = useSendAdminMailboxMessage();

  const invalidateMailbox = () => {
    void queryClient.invalidateQueries({ queryKey: getGetAdminMailboxQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListAdminMailboxMessagesQueryKey(messagesParams) });
  };

  const handleConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    const input: AdminMailboxConnectInput = {
      email: connectEmail.trim(),
      password: connectPassword,
      imapHost: imapHost.trim(),
      imapPort: Number(imapPort) as AdminMailboxConnectInput['imapPort'],
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort) as AdminMailboxConnectInput['smtpPort'],
    };
    connect.mutate({ data: input }, {
      onSuccess: () => {
        setConnectPassword('');
        setSuccessMessage('Mailbox connected. The inbox is ready to sync.');
        invalidateMailbox();
      },
    });
  };

  const handleDisconnect = () => {
    if (!window.confirm('Disconnect this company mailbox? Mailbox credentials will no longer be available to the admin.')) return;
    setSuccessMessage('');
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setSelectedUid(null);
        setComposerMode(null);
        setSuccessMessage('Mailbox disconnected.');
        invalidateMailbox();
      },
    });
  };

  const openComposer = (mode: ComposerMode, message?: AdminMailboxMessageSummary) => {
    setSuccessMessage('');
    setComposerMode(mode);
    if (mode === 'reply' && message) {
      setRecipient(message.from);
      setSubject(/^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`);
      setBody('');
      setReplyToUid(message.uid);
    } else {
      setRecipient('');
      setSubject('');
      setBody('');
      setReplyToUid(undefined);
    }
  };

  const closeComposer = () => {
    setComposerMode(null);
    setReplyToUid(undefined);
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (body.length > 30_000 || subject.length > 250) return;
    const input: AdminMailboxSendInput = {
      to: recipient.trim(),
      subject: subject.trim(),
      text: body,
      ...(replyToUid !== undefined ? { replyToUid } : {}),
    };
    send.mutate({ data: input }, {
      onSuccess: (result) => {
        setSuccessMessage(`Message sent to ${result.recipient}.`);
        closeComposer();
        void queryClient.invalidateQueries({ queryKey: getListAdminMailboxMessagesQueryKey(messagesParams) });
      },
    });
  };

  const selectedDetail = detailQuery.data?.message;

  if (mailboxQuery.isLoading && !mailboxQuery.data) {
    return <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8"><MailboxSkeleton /></main>;
  }

  if (mailboxQuery.isError && !mailboxQuery.data) {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-8">
        <Notice tone="error">{errorText(mailboxQuery.error, 'Mailbox status could not be loaded.')}</Notice>
        <button type="button" onClick={() => void mailboxQuery.refetch()} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-[#d5dae5] bg-[#fffefe] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#35405b] hover:bg-[#f7f9fd]">
          <RefreshCw size={14} /> Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-[70dvh] bg-[#eef1f7] px-4 py-6 text-[#172039] sm:px-8 sm:py-9">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-col gap-5 border-b border-[#d8deea] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#1f3fb7]">
              <span className="inline-block h-1.5 w-1.5 bg-[#1f3fb7]" /> Catus Synergy / Communications
            </div>
            <h1 className="display mt-3 text-[clamp(2.2rem,5vw,3.7rem)] leading-none tracking-[-0.065em] text-[#172039]">Company mailbox</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#697186]">A direct line into the conversations moving the work forward.</p>
          </div>
          {connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-h-10 items-center gap-2 border border-[#c8e2d3] bg-[#f2fbf5] px-3.5 text-xs text-[#32734d]">
                <span className="h-2 w-2 rounded-full bg-[#4a9a68]" /> Connected
              </div>
              <button type="button" onClick={handleDisconnect} disabled={disconnect.isPending} data-testid="button-mailbox-disconnect" className="inline-flex min-h-10 items-center gap-2 border border-[#efc9c7] bg-[#fff9f8] px-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a34643] transition-colors hover:bg-[#fff1ef] disabled:opacity-50">
                <Unplug size={14} /> {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <div className="flex min-h-10 items-center gap-2 border border-[#e8dcb7] bg-[#fffaf0] px-3.5 text-xs text-[#8a6b28]">
              <span className="h-2 w-2 rounded-full bg-[#c49a3a]" /> Not connected
            </div>
          )}
        </header>

        {successMessage ? <div className="mb-5"><Notice tone="success">{successMessage}</Notice></div> : null}
        {mailboxQuery.isError ? <div className="mb-5"><Notice tone="error">{errorText(mailboxQuery.error, 'Mailbox status could not be refreshed.')}</Notice></div> : null}
        {disconnect.isError ? <div className="mb-5"><Notice tone="error">{errorText(disconnect.error, 'The mailbox could not be disconnected.')}</Notice></div> : null}
        {connect.isError ? <div className="mb-5"><Notice tone="error">{errorText(connect.error, 'Connection could not be established. Check the credentials and server settings.')}</Notice></div> : null}
        {send.isError ? <div className="mb-5"><Notice tone="error">{errorText(send.error, 'The message could not be sent. Your draft is still available.')}</Notice></div> : null}

        {!connected ? (
          <section className="grid overflow-hidden rounded-[3px] border border-[#dfe3eb] bg-[#fffefe] shadow-[0_12px_34px_rgba(28,41,77,0.04)] lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="relative overflow-hidden bg-[#162675] p-6 text-white sm:p-9">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-[#aebeff]/15" />
              <div className="relative flex h-full flex-col justify-between gap-14">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center border border-white/20 bg-white/5"><Mail size={19} /></div>
                  <p className="mt-10 font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#bdcaff]">Go45 / Secure connection</p>
                  <h2 className="display mt-4 max-w-[390px] text-[clamp(2.3rem,4vw,3.6rem)] leading-[0.98] tracking-[-0.06em]">Bring the office inbox into view.</h2>
                  <p className="mt-5 max-w-[390px] text-sm leading-6 text-white/65">Connect your company email using the IMAP and SMTP settings supplied by Go45. Credentials are sent directly to the mailbox connection service.</p>
                </div>
                <div className="flex items-start gap-3 border-t border-white/20 pt-5">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#bdcaff]" />
                  <p className="max-w-[360px] text-xs leading-5 text-white/60">Use an app-specific password if your mailbox provider requires one. Server hosts are configurable below.</p>
                </div>
              </div>
            </aside>
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="mb-7">
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#1f3fb7]">Mailbox setup / 01</p>
                <h3 className="display mt-2 text-3xl tracking-[-0.055em]">Connection details</h3>
              </div>
              <form onSubmit={handleConnect} className="space-y-6" data-testid="form-mailbox-connect">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><Label>Company email</Label><TextInput value={connectEmail} onChange={setConnectEmail} type="email" placeholder="name@company.com" autoComplete="email" required testId="input-mailbox-email" /></label>
                  <label><Label>Email password</Label><TextInput value={connectPassword} onChange={setConnectPassword} type="password" placeholder="Mailbox password" autoComplete="current-password" required testId="input-mailbox-password" /></label>
                </div>
                <div className="border-t border-[#e7e9ee] pt-5">
                  <div className="mb-4 flex items-center gap-2 text-[#172039]"><Server size={15} className="text-[#1f3fb7]" /><p className="text-[10px] font-semibold uppercase tracking-[0.15em]">Incoming mail · IMAP</p></div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
                    <label><Label>IMAP hostname</Label><TextInput value={imapHost} onChange={setImapHost} placeholder="Your Go45 IMAP host" required testId="input-mailbox-imap-host" /></label>
                    <label><Label>Port</Label><select value={imapPort} onChange={(event) => setImapPort(event.target.value)} data-testid="select-mailbox-imap-port" className="h-11 w-full rounded-[2px] border border-[#d9deea] bg-[#fbfcfe] px-3 text-sm outline-none focus:border-[#3150bb] focus:ring-2 focus:ring-[#dce4ff]"><option value="993">993 · SSL</option><option value="143">143 · STARTTLS</option></select></label>
                  </div>
                </div>
                <div className="border-t border-[#e7e9ee] pt-5">
                  <div className="mb-4 flex items-center gap-2 text-[#172039]"><ArrowUpRight size={15} className="text-[#1f3fb7]" /><p className="text-[10px] font-semibold uppercase tracking-[0.15em]">Outgoing mail · SMTP</p></div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
                    <label><Label>SMTP hostname</Label><TextInput value={smtpHost} onChange={setSmtpHost} placeholder="Your Go45 SMTP host" required testId="input-mailbox-smtp-host" /></label>
                    <label><Label>Port</Label><select value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} data-testid="select-mailbox-smtp-port" className="h-11 w-full rounded-[2px] border border-[#d9deea] bg-[#fbfcfe] px-3 text-sm outline-none focus:border-[#3150bb] focus:ring-2 focus:ring-[#dce4ff]"><option value="465">465 · SSL</option><option value="587">587 · STARTTLS</option></select></label>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-[#e7e9ee] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-[#8991a2]"><ShieldCheck size={14} className="text-[#1f3fb7]" /> IMAP 993 and SMTP 465 by default</p>
                  <button type="submit" disabled={connect.isPending} data-testid="button-mailbox-connect" className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#1f3fb7] px-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white shadow-[0_8px_20px_rgba(31,63,183,0.18)] transition-colors hover:bg-[#173293] disabled:cursor-not-allowed disabled:opacity-55">
                    {connect.isPending ? <><RefreshCw size={14} className="animate-spin" /> Connecting…</> : <>Connect mailbox <ChevronRight size={15} /></>}
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[3px] border border-[#dfe3eb] bg-[#fffefe] shadow-[0_12px_34px_rgba(28,41,77,0.04)]">
            <div className="flex flex-col gap-4 border-b border-[#e7e9ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#edf1ff] text-[#1f3fb7]"><Inbox size={18} /></div>
                <div className="min-w-0">
                  <h2 className="display text-2xl leading-none tracking-[-0.05em]">Inbox</h2>
                  <p className="mt-1 truncate text-xs text-[#7b8498]">{mailbox?.email ?? messageListQuery.data?.email ?? 'Connected mailbox'} <span className="px-1.5 text-[#c1c6d1]">/</span> {messages.length} recent {messages.length === 1 ? 'message' : 'messages'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 pr-2 text-[10px] uppercase tracking-[0.11em] text-[#8a92a4] sm:flex"><Clock3 size={13} /> Connected {formatDate(mailbox?.connectedAt)}</div>
                <button type="button" onClick={() => { setSuccessMessage(''); openComposer('new'); }} data-testid="button-mailbox-compose" className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#1f3fb7] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#173293]">
                  <MailPlus size={14} /> Compose
                </button>
                <button type="button" onClick={() => void messageListQuery.refetch()} disabled={messageListQuery.isFetching} aria-label="Refresh inbox" data-testid="button-mailbox-refresh" className="inline-flex h-10 w-10 items-center justify-center border border-[#d9deea] text-[#53617c] transition-colors hover:bg-[#f5f7fc] disabled:opacity-50">
                  <RefreshCw size={14} className={messageListQuery.isFetching ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {messageListQuery.isError ? (
              <div className="p-5 sm:p-7">
                <Notice tone="error">{errorText(messageListQuery.error, 'Recent messages could not be loaded.')}</Notice>
                <button type="button" onClick={() => void messageListQuery.refetch()} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-[#d5dae5] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#35405b] hover:bg-[#f7f9fd]"><RefreshCw size={14} /> Retry inbox</button>
              </div>
            ) : messageListQuery.isLoading ? (
              <div className="grid min-h-[480px] animate-pulse lg:grid-cols-[350px_1fr]">
                <div className="space-y-3 border-b border-[#e7e9ee] p-4 lg:border-b-0 lg:border-r">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-[80px] bg-[#f2f4f8]" />)}</div>
                <div className="p-8"><div className="h-5 w-1/3 bg-[#edf0f6]" /><div className="mt-5 h-4 w-1/2 bg-[#f2f4f8]" /><div className="mt-12 space-y-3"><div className="h-4 bg-[#f2f4f8]" /><div className="h-4 w-4/5 bg-[#f2f4f8]" /></div></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center border border-[#dfe3eb] bg-[#f8f9fc] text-[#8490a8]"><Inbox size={22} /></div>
                <p className="mt-6 font-mono-brand text-[10px] uppercase tracking-[0.17em] text-[#1f3fb7]">Nothing new</p>
                <h3 className="display mt-2 text-3xl tracking-[-0.055em]">Your inbox is clear.</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#788196]">Recent mail will appear here when the mailbox receives messages.</p>
                <button type="button" onClick={() => void messageListQuery.refetch()} className="mt-6 inline-flex min-h-10 items-center gap-2 border border-[#d5dae5] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#35405b] hover:bg-[#f7f9fd]"><RefreshCw size={14} /> Check again</button>
              </div>
            ) : (
              <div className="grid min-h-[580px] lg:grid-cols-[350px_1fr]">
                <div className="max-h-[680px] overflow-y-auto border-b border-[#e7e9ee] bg-[#fbfcfe] lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between border-b border-[#e7e9ee] px-5 py-3">
                    <p className="font-mono-brand text-[9px] uppercase tracking-[0.15em] text-[#7d879b]">Recent messages</p>
                    <span className="text-[10px] tabular-nums text-[#9aa2b2]">{messages.length.toString().padStart(2, '0')}</span>
                  </div>
                  <ul className="divide-y divide-[#e8ebf1]">
                    {messages.map((message) => {
                      const active = message.uid === selectedUid;
                      return (
                        <li key={message.uid}>
                          <button type="button" onClick={() => { setSelectedUid(message.uid); setComposerMode(null); setSuccessMessage(''); }} data-testid={`button-mailbox-message-${message.uid}`} aria-current={active ? 'true' : undefined} className={`w-full border-l-2 px-4 py-4 text-left transition-colors ${active ? 'border-[#1f3fb7] bg-white' : 'border-transparent hover:bg-white'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[10px] font-semibold ${active ? 'bg-[#e9edff] text-[#1f3fb7]' : 'bg-[#eceff5] text-[#68728a]'}`}>{initials(message.fromName ?? message.from)}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`truncate text-xs ${message.unread ? 'font-semibold text-[#172039]' : 'font-medium text-[#4a536b]'}`}>{message.fromName || message.from}</p>
                                  <time className="shrink-0 text-[10px] text-[#9098a8]">{formatDate(message.date)}</time>
                                </div>
                                <p className={`mt-1 truncate text-[13px] ${message.unread ? 'font-semibold text-[#172039]' : 'text-[#44506a]'}`}>{message.subject || '(no subject)'}</p>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8991a2]">{message.preview}</p>
                              </div>
                              {message.unread ? <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3150bb]" aria-label="Unread" /> : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="min-w-0">
                  {!selectedUid ? (
                    <div className="flex min-h-[440px] items-center justify-center text-sm text-[#8991a2]">Select a message to read it.</div>
                  ) : detailQuery.isError ? (
                    <div className="p-6 sm:p-9">
                      <Notice tone="error">{errorText(detailQuery.error, 'This message could not be opened.')}</Notice>
                      <button type="button" onClick={() => void detailQuery.refetch()} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-[#d5dae5] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#35405b] hover:bg-[#f7f9fd]"><RefreshCw size={14} /> Retry message</button>
                    </div>
                  ) : detailQuery.isLoading || !selectedDetail ? (
                    <div className="animate-pulse p-6 sm:p-9">
                      <div className="h-3 w-20 bg-[#edf0f6]" /><div className="mt-5 h-8 w-3/4 bg-[#edf0f6]" /><div className="mt-7 h-4 w-1/2 bg-[#f2f4f8]" />
                      <div className="mt-12 space-y-3">{[0, 1, 2, 3].map((item) => <div key={item} className={`h-4 bg-[#f2f4f8] ${item === 3 ? 'w-2/3' : 'w-full'}`} />)}</div>
                    </div>
                  ) : (
                    <article className="flex min-h-[580px] flex-col">
                      <div className="border-b border-[#e7e9ee] px-5 py-5 sm:px-8 sm:py-7">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-mono-brand text-[9px] uppercase tracking-[0.16em] text-[#1f3fb7]">Message / {String(selectedDetail.uid).padStart(4, '0')}</p>
                          <time className="shrink-0 text-[11px] text-[#8a92a4]">{formatDate(selectedDetail.date, true)}</time>
                        </div>
                        <h3 className="display mt-4 break-words text-[clamp(1.55rem,3vw,2.3rem)] leading-tight tracking-[-0.055em] text-[#172039]">{selectedDetail.subject || '(no subject)'}</h3>
                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#edf1ff] text-xs font-semibold text-[#1f3fb7]">{initials(selectedDetail.fromName ?? selectedDetail.from)}</div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#29334b]">{selectedDetail.fromName || selectedDetail.from}</p>
                              <p className="mt-1 truncate text-xs text-[#8790a1]">To {selectedDetail.to}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => openComposer('reply', selectedDetail)} data-testid="button-mailbox-reply" className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 border border-[#d5dae5] px-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#35405b] transition-colors hover:border-[#aeb9d4] hover:bg-[#f7f9fd]"><Reply size={14} /> Reply</button>
                        </div>
                      </div>
                      <div className="flex-1 whitespace-pre-wrap break-words px-5 py-7 text-sm leading-7 text-[#3e4962] sm:px-8 sm:py-9">{selectedDetail.bodyText || <span className="italic text-[#9299a7]">This message has no plain-text body.</span>}</div>
                      <div className="border-t border-[#e7e9ee] bg-[#fbfcfe] px-5 py-3 sm:px-8">
                        <p className="font-mono-brand text-[9px] uppercase tracking-[0.14em] text-[#9299a7]">Delivered to {selectedDetail.to}</p>
                      </div>
                    </article>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {composerMode ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101a3a]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !send.isPending) closeComposer(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="mailbox-composer-title" className="w-full max-w-[700px] overflow-hidden rounded-t-[3px] border border-[#d9deea] bg-[#fffefe] shadow-[0_24px_80px_rgba(17,31,70,0.25)] sm:rounded-[3px]">
              <div className="flex items-center justify-between border-b border-[#e7e9ee] bg-[#fbfcfe] px-5 py-4 sm:px-7">
                <div>
                  <p className="font-mono-brand text-[9px] uppercase tracking-[0.16em] text-[#1f3fb7]">{composerMode === 'reply' ? 'Reply' : 'New message'} / Outgoing</p>
                  <h2 id="mailbox-composer-title" className="display mt-1 text-2xl tracking-[-0.05em]">{composerMode === 'reply' ? 'Write your reply.' : 'Compose a message.'}</h2>
                </div>
                <button type="button" onClick={closeComposer} disabled={send.isPending} aria-label="Close composer" data-testid="button-mailbox-close-composer" className="flex h-9 w-9 items-center justify-center text-[#6e7890] transition-colors hover:bg-[#edf0f6] disabled:opacity-40"><X size={17} /></button>
              </div>
              <form onSubmit={handleSend} className="p-5 sm:p-7">
                {send.isError ? <div className="mb-4"><Notice tone="error">{errorText(send.error, 'The message could not be sent. Please try again.')}</Notice></div> : null}
                <div className="space-y-4">
                  <label><Label>To</Label><TextInput value={recipient} onChange={setRecipient} type="email" placeholder="recipient@company.com" required testId="input-mailbox-recipient" /></label>
                  <label><Label>Subject</Label><TextInput value={subject} onChange={setSubject} placeholder="Subject" required testId="input-mailbox-subject" /></label>
                  <label className="block"><span className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-[#68728a]"><span>Message</span><span className={`font-mono-brand normal-case tracking-normal ${body.length > 30_000 ? 'text-[#a34643]' : 'text-[#9aa2b2]'}`}>{body.length.toLocaleString()} / 30,000</span></span>
                    <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={30_000} rows={9} placeholder="Write your message…" data-testid="input-mailbox-body" className="min-h-[190px] w-full resize-y rounded-[2px] border border-[#d9deea] bg-[#fbfcfe] px-3.5 py-3 text-sm leading-6 text-[#1a2238] outline-none placeholder:text-[#a3aaba] focus:border-[#3150bb] focus:ring-2 focus:ring-[#dce4ff]" />
                  </label>
                </div>
                <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#e7e9ee] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#9299a7]">Plain-text email · sent from {mailbox?.email}</p>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={closeComposer} disabled={send.isPending} className="min-h-10 border border-[#d5dae5] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#59637a] hover:bg-[#f7f9fd] disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={send.isPending || !recipient.trim() || !subject.trim() || !body.trim() || subject.length > 250 || body.length > 30_000} data-testid="button-mailbox-send" className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#1f3fb7] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#173293] disabled:cursor-not-allowed disabled:opacity-50">
                      <Send size={14} /> {send.isPending ? 'Sending…' : 'Send message'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
