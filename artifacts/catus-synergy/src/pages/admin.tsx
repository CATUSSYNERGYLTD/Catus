import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Form } from '@/components/ui/form';
import AdminEmail from '@/components/admin-email';
import { AdminInstallButton } from '@/components/admin-install-button';
import { defaultSiteContent } from '@/lib/default-site-content';
import {
  getGetAdminStatusQueryKey,
  getGetSiteContentQueryKey,
  uploadAdminImage,
  useChangeAdminPassword,
  useGetAdminStatus,
  useGetSiteContent,
  useLoginAdmin,
  useLogoutAdmin,
  useUpdateSiteContent,
  type SiteContent,
  type ServiceItem,
} from '@workspace/api-client-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowRight, Check, ChevronRight, CircleAlert, Eye, LayoutDashboard, LogOut, Menu, Plus, Save, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';

type SectionKey =
  | 'overview'
  | 'brand'
  | 'hero'
  | 'about'
  | 'services'
  | 'businesses'
  | 'projects'
  | 'approach'
  | 'partners'
  | 'values'
  | 'leadership'
  | 'contact'
  | 'footer'
  | 'email';

type LoginValues = { username: string; password: string };
type PasswordValues = { newPassword: string; confirmPassword: string };

const sections: { key: SectionKey; label: string; detail: string }[] = [
  { key: 'overview', label: 'Overview', detail: 'Site map' },
  { key: 'brand', label: 'Brand & navigation', detail: 'Identity' },
  { key: 'hero', label: 'Hero', detail: 'Opening frame' },
  { key: 'about', label: 'About', detail: 'Company story' },
  { key: 'services', label: 'Services', detail: 'What we do' },
  { key: 'businesses', label: 'Businesses', detail: 'Operating areas' },
  { key: 'projects', label: 'Projects', detail: 'Selected work' },
  { key: 'approach', label: 'Approach', detail: 'How we work' },
  { key: 'partners', label: 'Partners', detail: 'Trusted by' },
  { key: 'values', label: 'Values', detail: 'Our principles' },
  { key: 'leadership', label: 'Leadership', detail: 'Point of view' },
  { key: 'contact', label: 'Contact', detail: 'Start a conversation' },
  { key: 'footer', label: 'Footer', detail: 'Closing frame' },
  { key: 'email', label: 'Company email', detail: 'Inbox & replies' },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

function isImageFieldTestId(testId: string): boolean {
  return (
    testId === 'input-brand-logo-path' ||
    testId === 'input-leadership-portrait' ||
    /-(image|logo)$/.test(testId)
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  testId,
  hint,
  inputType = 'text',
  autoComplete,
  skipImageUpload = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  testId: string;
  hint?: string;
  inputType?: string;
  autoComplete?: string;
  skipImageUpload?: boolean;
}) {
  if (!skipImageUpload && isImageFieldTestId(testId)) {
    return (
      <ImageField
        label={label.replace(/\s+URL\s*\/\s*path$/i, '')}
        value={value}
        onChange={onChange}
        testId={testId}
      />
    );
  }

  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#555d73]">
        {label}
        {hint ? <span className="normal-case tracking-normal text-[#9aa0ae]">{hint}</span> : null}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          data-testid={testId}
          rows={4}
          className="min-h-[104px] w-full resize-y rounded-[2px] border border-[#d8dce5] bg-[#fbfcfe] px-4 py-3 text-sm leading-6 text-[#1a2238] outline-none transition-colors placeholder:text-[#a4aaba] focus:border-[#1f3fb7] focus:ring-2 focus:ring-[#dbe4ff]"
        />
      ) : (
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          data-testid={testId}
          className="h-12 w-full rounded-[2px] border border-[#d8dce5] bg-[#fbfcfe] px-4 text-sm text-[#1a2238] outline-none transition-colors placeholder:text-[#a4aaba] focus:border-[#1f3fb7] focus:ring-2 focus:ring-[#dbe4ff]"
        />
      )}
    </label>
  );
}

const maxImageUploadBytes = 15 * 1024 * 1024;
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

async function prepareImageForUpload(file: File): Promise<{ blob: Blob; contentType: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const inferredType: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
  };
  const declaredType = file.type.toLowerCase();
  const contentType =
    !declaredType || declaredType === 'application/octet-stream'
      ? inferredType[extension] || declaredType
      : declaredType;
  const isHeic =
    ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'].includes(contentType) ||
    /\.(heic|heif)$/i.test(file.name);

  if (isHeic) {
    if (typeof createImageBitmap !== 'function') {
      throw new Error('This browser cannot convert HEIC photos. Choose a JPEG version of the image.');
    }
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error('This browser cannot read this HEIC photo. Choose a JPEG version of the image.');
    }
    try {
      const scale = Math.min(1, 3200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('This browser could not prepare the selected photo.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (converted) => converted ? resolve(converted) : reject(new Error('This browser could not convert the selected photo.')),
          'image/jpeg',
          0.9,
        );
      });
      return { blob, contentType: 'image/jpeg' };
    } finally {
      bitmap.close();
    }
  }

  if (!supportedImageTypes.has(contentType)) {
    throw new Error('Choose a JPEG, PNG, WebP, AVIF, or GIF image. HEIC photos are converted when your browser supports it.');
  }
  return { blob: file, contentType };
}

function ImageField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const upload = useMutation({
    mutationFn: ({ blob, contentType }: { blob: Blob; contentType: string }) =>
      uploadAdminImage(blob, { headers: { 'Content-Type': contentType } }),
  });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setNotice(null);
    try {
      const prepared = await prepareImageForUpload(file);
      if (prepared.blob.size > maxImageUploadBytes) {
        throw new Error('Images must be 15 MB or smaller.');
      }
      const result = await upload.mutateAsync(prepared);
      onChange(result.url);
      setNotice({ tone: 'success', message: 'Image uploaded to Supabase. Save changes to publish it.' });
    } catch (error) {
      setNotice({ tone: 'error', message: getErrorMessage(error, 'The image could not be uploaded.') });
    }
  };

  return (
    <div className="space-y-3">
      <Field
        label={`${label} URL / path`}
        value={value}
        onChange={(next) => {
          setNotice(null);
          onChange(next);
        }}
        hint="Paste a public URL or upload from your phone"
        testId={testId}
        skipImageUpload
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          aria-label={`Choose ${label.toLowerCase()} image from your phone`}
          data-testid={`input-upload-${testId}`}
          className="sr-only"
        />
        <ActionButton
          variant="quiet"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          testId={`button-upload-${testId}`}
        >
          {upload.isPending ? 'Uploading…' : value ? 'Replace image from phone' : 'Choose image from phone'}
        </ActionButton>
        {value ? (
          <img
            src={value}
            alt={`Current ${label.toLowerCase()} preview`}
            className="h-16 w-24 rounded-[2px] border border-[#dfe3eb] bg-white object-contain p-1"
          />
        ) : null}
        <p className="text-xs leading-5 text-[#7b8498]">JPEG, PNG, WebP, AVIF or GIF · max 15 MB. HEIC photos are converted when supported.</p>
      </div>
      {notice ? <StatusMessage tone={notice.tone} message={notice.message} testId={`status-${testId}`} /> : null}
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[3px] border border-[#dfe3eb] bg-[#fffefe] shadow-[0_12px_34px_rgba(28,41,77,0.04)]">
      <div className="border-b border-[#e7e9ee] px-5 py-5 sm:px-7">
        <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#1f3fb7]">{eyebrow}</p>
        <h2 className="display mt-2 text-[clamp(1.5rem,3vw,2.35rem)] leading-tight tracking-[-0.045em] text-[#172039]">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697186]">{description}</p> : null}
      </div>
      <div className="space-y-6 p-5 sm:p-7">{children}</div>
    </section>
  );
}

function Subheading({ children }: { children: ReactNode }) {
  return <h3 className="border-b border-[#e9ebf0] pb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#172039]">{children}</h3>;
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  testId,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'quiet' | 'danger';
  testId: string;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-[#1f3fb7] text-white hover:bg-[#173293] shadow-[0_8px_20px_rgba(31,63,183,0.18)]',
    quiet: 'border border-[#d5dae5] bg-[#fffefe] text-[#35405b] hover:border-[#aeb9d4] hover:bg-[#f7f9fd]',
    danger: 'border border-[#efc9c7] bg-[#fff9f8] text-[#a34643] hover:bg-[#fff1ef]',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function RepeatableList<T>({
  items,
  createItem,
  onChange,
  children,
  addLabel,
  testId,
}: {
  items: T[];
  createItem: () => T;
  onChange: (items: T[]) => void;
  children: (item: T, index: number, update: (next: T) => void) => ReactNode;
  addLabel: string;
  testId: string;
}) {
  return (
    <div className="space-y-4">
      {items.length ? (
        items.map((item, index) => (
          <div key={index} className="relative rounded-[2px] border border-[#e2e6ee] bg-[#fbfcfe] p-4 sm:p-5" data-testid={`row-${testId}-${index}`}>
            {children(item, index, (next) => onChange(items.map((entry, entryIndex) => (entryIndex === index ? next : entry))))}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, entryIndex) => entryIndex !== index))}
              aria-label={`Remove ${addLabel.toLowerCase()} ${index + 1}`}
              data-testid={`button-remove-${testId}-${index}`}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-[2px] text-[#9a6270] transition-colors hover:bg-[#fff0f0] hover:text-[#a34643]"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))
      ) : (
        <div className="rounded-[2px] border border-dashed border-[#cad1df] bg-[#fbfcfe] px-5 py-8 text-center text-sm text-[#7a8294]">Nothing here yet. Add the first entry below.</div>
      )}
      <button
        type="button"
        onClick={() => onChange([...items, createItem()])}
        data-testid={`button-add-${testId}`}
        className="inline-flex min-h-10 items-center gap-2 border border-dashed border-[#9caaca] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1f3fb7] transition-colors hover:border-[#1f3fb7] hover:bg-[#f4f7ff]"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

function ItemFields({
  item,
  index,
  onChange,
  project = false,
}: {
  item: ServiceItem | SiteContent['projects']['items'][number];
  index: number;
  onChange: (item: ServiceItem | SiteContent['projects']['items'][number]) => void;
  project?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Title" value={item.title} onChange={(value) => onChange({ ...item, title: value })} testId={`input-${project ? 'project' : 'service'}-${index}-title`} />
      {project ? (
        <>
          <Field label="Category" value={(item as SiteContent['projects']['items'][number]).category} onChange={(value) => onChange({ ...item, category: value })} testId={`input-project-${index}-category`} />
          <Field label="Location" value={(item as SiteContent['projects']['items'][number]).location} onChange={(value) => onChange({ ...item, location: value })} testId={`input-project-${index}-location`} />
        </>
      ) : (
        <Field label="Kicker" value={(item as ServiceItem).kicker} onChange={(value) => onChange({ ...item, kicker: value })} testId={`input-service-${index}-kicker`} />
      )}
      <div className="sm:col-span-2">
        <Field label="Description" value={item.description} onChange={(value) => onChange({ ...item, description: value })} multiline testId={`input-${project ? 'project' : 'service'}-${index}-description`} />
      </div>
      <div className="sm:col-span-2">
        <Field label="Image URL / path" value={item.image} onChange={(value) => onChange({ ...item, image: value })} testId={`input-${project ? 'project' : 'service'}-${index}-image`} />
      </div>
      {project ? (
        <label className="flex items-center gap-3 text-sm text-[#4e5870] sm:col-span-2">
          <input
            type="checkbox"
            checked={(item as SiteContent['projects']['items'][number]).illustrative}
            onChange={(event) => onChange({ ...item, illustrative: event.target.checked })}
            data-testid={`input-project-${index}-illustrative`}
            className="h-4 w-4 accent-[#1f3fb7]"
          />
          Mark as illustrative sector view
        </label>
      ) : null}
    </div>
  );
}

function TwoColumnFields({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function LoginView({ onLoggedIn }: { onLoggedIn: () => void }) {
  const login = useLoginAdmin();
  const form = useForm<LoginValues>({ defaultValues: { username: '', password: '' } });
  const [error, setError] = useState('');
  const submit = form.handleSubmit((values) => {
    setError('');
    login.mutate({ data: values }, {
      onSuccess: onLoggedIn,
      onError: (reason) => setError(getErrorMessage(reason, 'Those credentials could not be accepted.')),
    });
  });
  return (
    <main className="min-h-[100dvh] bg-[#eef1f7] px-5 py-8 text-[#172039] sm:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1180px] overflow-hidden rounded-[3px] border border-[#d8deea] bg-[#fffefe] shadow-[0_28px_80px_rgba(30,48,91,0.12)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden overflow-hidden bg-[#162675] p-10 text-white lg:block">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-16 h-96 w-96 rounded-full border border-[#aebeff]/20" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <img src="/brand/catus-synergy-wordmark-white.png" alt="Catus Synergy Limited" className="h-16 w-[180px] object-contain object-left" data-testid="img-admin-login-wordmark" />
              <p className="display mt-16 max-w-[310px] text-5xl leading-[0.98] tracking-[-0.06em]">The quiet room behind the public face.</p>
            </div>
            <div className="border-t border-white/20 pt-5">
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#bdcaff]">Trusted operator console</p>
              <p className="mt-3 max-w-[300px] text-sm leading-6 text-white/65">A precise place to keep the Catus Synergy story current.</p>
            </div>
          </div>
        </aside>
        <div className="flex items-center px-6 py-12 sm:px-14 lg:px-16">
          <div className="w-full max-w-[430px]">
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center bg-[#162675] text-white"><Sparkles size={17} /></div>
              <div><p className="display text-2xl tracking-[-0.05em]">Catus Synergy</p><p className="font-mono-brand text-[9px] uppercase tracking-[0.14em] text-[#68728a]">Admin</p></div>
            </div>
            <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#1f3fb7]">Admin access / 01</p>
            <h1 className="display mt-4 text-5xl leading-none tracking-[-0.06em] text-[#172039]">Welcome back.</h1>
            <p className="mt-5 max-w-[350px] text-sm leading-6 text-[#697186]">Sign in to update the public website. This space is for one trusted operator.</p>
            <Form {...form}>
              <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
                <Field label="Username" value={form.watch('username')} onChange={(value) => form.setValue('username', value)} autoComplete="username" testId="input-admin-username" />
                <label className="block space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#555d73]">Password</span>
                  <input type="password" autoComplete="current-password" {...form.register('password', { required: true })} data-testid="input-admin-password" className="h-12 w-full rounded-[2px] border border-[#d8dce5] bg-[#fbfcfe] px-4 text-sm text-[#1a2238] outline-none focus:border-[#1f3fb7] focus:ring-2 focus:ring-[#dbe4ff]" />
                </label>
                {error ? <StatusMessage tone="error" message={error} testId="status-login-error" /> : null}
                <ActionButton type="submit" disabled={login.isPending} testId="button-admin-login">{login.isPending ? 'Checking access…' : 'Enter console'} <ArrowRight size={15} /></ActionButton>
              </form>
            </Form>
            <p className="mt-9 flex items-center gap-2 text-xs text-[#8a92a4]"><ShieldCheck size={14} className="text-[#1f3fb7]" /> Content changes are saved directly to the public site.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function PasswordChangeView({ onChanged, username }: { onChanged: () => void; username: string | null }) {
  const passwordChange = useChangeAdminPassword();
  const form = useForm<PasswordValues>({ defaultValues: { newPassword: '', confirmPassword: '' } });
  const [error, setError] = useState('');
  const submit = form.handleSubmit((values) => {
    if (values.newPassword.length < 12) {
      setError('Use at least 12 characters for the new password.');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      setError('The two password fields need to match.');
      return;
    }
    setError('');
    passwordChange.mutate({ data: { newPassword: values.newPassword } }, { onSuccess: onChanged, onError: (reason) => setError(getErrorMessage(reason, 'The password could not be changed.')) });
  });
  return (
    <main className="min-h-[100dvh] bg-[#eef1f7] px-5 py-8 text-[#172039] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[620px] items-center">
        <div className="w-full rounded-[3px] border border-[#d8deea] bg-[#fffefe] p-7 shadow-[0_28px_80px_rgba(30,48,91,0.1)] sm:p-12">
          <div className="flex h-12 w-12 items-center justify-center bg-[#162675] text-white"><ShieldCheck size={20} /></div>
          <p className="mt-9 font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#1f3fb7]">First access / secure your console</p>
          <h1 className="display mt-4 text-5xl leading-none tracking-[-0.06em]">Choose a private key.</h1>
          <p className="mt-5 max-w-[460px] text-sm leading-6 text-[#697186]">Welcome{username ? `, ${username}` : ''}. Before editing the site, replace the initial password with one only you know.</p>
          <Form {...form}>
            <form onSubmit={submit} className="mt-9 space-y-5" noValidate>
              <label className="block space-y-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#555d73]">New password</span><input type="password" autoComplete="new-password" {...form.register('newPassword')} data-testid="input-new-password" className="h-12 w-full rounded-[2px] border border-[#d8dce5] bg-[#fbfcfe] px-4 text-sm outline-none focus:border-[#1f3fb7] focus:ring-2 focus:ring-[#dbe4ff]" /></label>
              <label className="block space-y-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#555d73]">Repeat new password</span><input type="password" autoComplete="new-password" {...form.register('confirmPassword')} data-testid="input-confirm-password" className="h-12 w-full rounded-[2px] border border-[#d8dce5] bg-[#fbfcfe] px-4 text-sm outline-none focus:border-[#1f3fb7] focus:ring-2 focus:ring-[#dbe4ff]" /></label>
              <p className="text-xs text-[#7b8498]">At least 12 characters. A phrase you can remember is better than a pattern.</p>
              {error ? <StatusMessage tone="error" message={error} testId="status-password-error" /> : null}
              <ActionButton type="submit" disabled={passwordChange.isPending} testId="button-change-password">{passwordChange.isPending ? 'Securing console…' : 'Set new password'} <ArrowRight size={15} /></ActionButton>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}

function StatusMessage({ tone, message, testId }: { tone: 'success' | 'error'; message: string; testId: string }) {
  return (
    <div data-testid={testId} role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 border px-3 py-3 text-xs leading-5 ${tone === 'error' ? 'border-[#efc9c7] bg-[#fff5f3] text-[#9d4d49]' : 'border-[#c8e2d3] bg-[#f2fbf5] text-[#32734d]'}`}>
      {tone === 'error' ? <CircleAlert size={14} className="mt-0.5 shrink-0" /> : <Check size={14} className="mt-0.5 shrink-0" />}<span>{message}</span>
    </div>
  );
}

function Overview({ content, onSelect }: { content: SiteContent; onSelect: (section: SectionKey) => void }) {
  const counts = [
    ['Hero slides', content.hero.slides.length, 'hero'],
    ['Services', content.services.items.length, 'services'],
    ['Businesses', content.businesses.items.length, 'businesses'],
    ['Projects', content.projects.items.length, 'projects'],
    ['Approach steps', content.approach.steps.length, 'approach'],
    ['Partners', content.partners.items.length, 'partners'],
    ['Values', content.values.items.length, 'values'],
  ] as const;
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[3px] bg-[#162675] p-6 text-white sm:p-9">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="relative grid gap-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-[#bdcaff]">Catus Synergy / Content room</p><h1 className="display mt-5 max-w-[720px] text-[clamp(2.8rem,7vw,6.1rem)] leading-[0.9] tracking-[-0.065em]">Keep the public story in step with the work.</h1><p className="mt-6 max-w-[540px] text-sm leading-6 text-white/65">Edit the sections below, then publish a complete content snapshot when the wording feels right.</p></div>
          <div className="border-l border-white/20 pl-5"><p className="font-mono-brand text-[10px] uppercase tracking-[0.16em] text-[#bdcaff]">Company</p><p className="mt-2 max-w-[190px] text-lg leading-6">{content.brand.companyName}</p></div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([label, count, section]) => (
          <button type="button" key={label} onClick={() => onSelect(section)} data-testid={`button-overview-${section}`} className="group flex items-end justify-between border border-[#dfe3eb] bg-[#fffefe] p-5 text-left transition-colors hover:border-[#9eadd1] hover:bg-[#f8faff]">
            <div><p className="font-mono-brand text-[9px] uppercase tracking-[0.14em] text-[#7b8498]">{label}</p><p className="display mt-4 text-4xl tracking-[-0.06em] text-[#172039]">{count}</p></div><ChevronRight size={16} className="text-[#1f3fb7] transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
      <SectionCard eyebrow="Editing rhythm" title="A small, focused system." description="The public site is intentionally edited as one content source. Work section by section, then save once when the complete page is ready.">
        <div className="grid gap-5 md:grid-cols-3">
          {[['01', 'Shape the message', 'Use the left rail to move through the public page in its natural order.'], ['02', 'Keep the details useful', 'Upload images from your phone or paste a public URL.'], ['03', 'Save the whole snapshot', 'One save replaces the complete public content record, so nothing is left half-published.']].map(([number, title, copy]) => <div key={number} className="border-l-2 border-[#1f3fb7] pl-4"><span className="font-mono-brand text-[10px] text-[#1f3fb7]">{number}</span><h3 className="mt-3 text-sm font-semibold text-[#172039]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#697186]">{copy}</p></div>)}
        </div>
      </SectionCard>
    </div>
  );
}

function ContentEditor({ section, content, setContent, onSelect }: { section: SectionKey; content: SiteContent; setContent: (content: SiteContent) => void; onSelect: (section: SectionKey) => void }) {
  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setContent({ ...content, [key]: value } as SiteContent);
  if (section === 'overview') return <Overview content={content} onSelect={onSelect} />;
  if (section === 'brand') return <div className="space-y-6"><SectionCard eyebrow="Identity / 01" title="Brand & navigation" description="These details set the voice and routes used across the public header and footer."><TwoColumnFields><Field label="Company name" value={content.brand.companyName} onChange={(value) => set('brand', { ...content.brand, companyName: value })} testId="input-brand-company-name" /><Field label="Tagline" value={content.brand.tagline} onChange={(value) => set('brand', { ...content.brand, tagline: value })} testId="input-brand-tagline" /><Field label="Logo URL / path" value={content.brand.logoPath} onChange={(value) => set('brand', { ...content.brand, logoPath: value })} testId="input-brand-logo-path" /><Field label="Header call to action" value={content.headerCta} onChange={(value) => set('headerCta', value)} testId="input-header-cta" /></TwoColumnFields><Subheading>Primary navigation</Subheading><RepeatableList items={content.navigation} createItem={() => ({ label: 'New page', href: '#new-page' })} onChange={(navigation) => set('navigation', navigation)} addLabel="Add navigation link" testId="navigation">{(item, index, update) => <TwoColumnFields><Field label="Label" value={item.label} onChange={(value) => update({ ...item, label: value })} testId={`input-navigation-${index}-label`} /><Field label="Href" value={item.href} onChange={(value) => update({ ...item, href: value })} testId={`input-navigation-${index}-href`} /></TwoColumnFields>}</RepeatableList></SectionCard></div>;
  if (section === 'hero') return <SectionCard eyebrow="Opening frame / 02" title="Hero" description="The first impression: a rotating set of business-area stories with a clear route into the site."><TwoColumnFields><Field label="Location label" value={content.hero.locationLabel} onChange={(value) => set('hero', { ...content.hero, locationLabel: value })} testId="input-hero-location" /><Field label="Watermark" value={content.hero.watermark} onChange={(value) => set('hero', { ...content.hero, watermark: value })} testId="input-hero-watermark" /><Field label="Footer label" value={content.hero.footerLabel} onChange={(value) => set('hero', { ...content.hero, footerLabel: value })} testId="input-hero-footer-label" /><Field label="Primary CTA" value={content.hero.primaryCta} onChange={(value) => set('hero', { ...content.hero, primaryCta: value })} testId="input-hero-primary-cta" /><Field label="Secondary CTA" value={content.hero.secondaryCta} onChange={(value) => set('hero', { ...content.hero, secondaryCta: value })} testId="input-hero-secondary-cta" /><div className="grid grid-cols-2 gap-4"><Field label="Pause label" value={content.hero.pauseLabel} onChange={(value) => set('hero', { ...content.hero, pauseLabel: value })} testId="input-hero-pause-label" /><Field label="Play label" value={content.hero.playLabel} onChange={(value) => set('hero', { ...content.hero, playLabel: value })} testId="input-hero-play-label" /></div></TwoColumnFields><Subheading>Slides</Subheading><RepeatableList items={content.hero.slides} createItem={() => ({ eyebrow: 'Business area / 01', headlineFirst: 'A clear first line.', headlineSecond: 'A stronger second.', description: '', image: '' })} onChange={(slides) => set('hero', { ...content.hero, slides })} addLabel="Add hero slide" testId="hero-slide">{(item, index, update) => <div className="grid gap-4 sm:grid-cols-2"><Field label="Eyebrow" value={item.eyebrow} onChange={(value) => update({ ...item, eyebrow: value })} testId={`input-hero-slide-${index}-eyebrow`} /><Field label="Image URL / path" value={item.image} onChange={(value) => update({ ...item, image: value })} testId={`input-hero-slide-${index}-image`} /><Field label="Headline first" value={item.headlineFirst} onChange={(value) => update({ ...item, headlineFirst: value })} testId={`input-hero-slide-${index}-headline-first`} /><Field label="Headline second" value={item.headlineSecond} onChange={(value) => update({ ...item, headlineSecond: value })} testId={`input-hero-slide-${index}-headline-second`} /><div className="sm:col-span-2"><Field label="Description" value={item.description} onChange={(value) => update({ ...item, description: value })} multiline testId={`input-hero-slide-${index}-description`} /></div></div>}</RepeatableList></SectionCard>;
  if (section === 'about') return <SectionCard eyebrow="Company story / 03" title="About" description="The short passage that tells people what the parent company holds together."><TwoColumnFields><Field label="Eyebrow" value={content.about.eyebrow} onChange={(value) => set('about', { ...content.about, eyebrow: value })} testId="input-about-eyebrow" /><Field label="Left note" value={content.about.leftNote} onChange={(value) => set('about', { ...content.about, leftNote: value })} multiline testId="input-about-left-note" /><Field label="Title first" value={content.about.titleFirst} onChange={(value) => set('about', { ...content.about, titleFirst: value })} testId="input-about-title-first" /><Field label="Title second" value={content.about.titleSecond} onChange={(value) => set('about', { ...content.about, titleSecond: value })} testId="input-about-title-second" /><Field label="Body" value={content.about.body} onChange={(value) => set('about', { ...content.about, body: value })} multiline testId="input-about-body" /><Field label="Supporting copy" value={content.about.supportingCopy} onChange={(value) => set('about', { ...content.about, supportingCopy: value })} multiline testId="input-about-supporting-copy" /><Field label="CTA label" value={content.about.cta} onChange={(value) => set('about', { ...content.about, cta: value })} testId="input-about-cta" /></TwoColumnFields></SectionCard>;
  if (section === 'services' || section === 'businesses') {
    const value = content[section] as SiteContent['services'];
    return <SectionCard eyebrow={section === 'services' ? 'What we do / 04' : 'Operating areas / 05'} title={section === 'services' ? 'Services' : 'Businesses'} description="Keep each entry concrete, concise and easy to scan."><TwoColumnFields><Field label="Eyebrow" value={value.eyebrow} onChange={(next) => set(section, { ...value, eyebrow: next })} testId={`input-${section}-eyebrow`} /><Field label="Title" value={value.title} onChange={(next) => set(section, { ...value, title: next })} testId={`input-${section}-title`} /><Field label="Title emphasis" value={value.titleEmphasis} onChange={(next) => set(section, { ...value, titleEmphasis: next })} testId={`input-${section}-title-emphasis`} />{section === 'services' ? <Field label="Note" value={value.note} onChange={(next) => set(section, { ...value, note: next })} multiline testId="input-services-note" /> : null}</TwoColumnFields><Subheading>Entries</Subheading><RepeatableList items={value.items} createItem={() => ({ title: 'New area', kicker: 'A useful point of view', description: '', image: '' })} onChange={(items) => set(section, { ...value, items })} addLabel={`Add ${section === 'services' ? 'service' : 'business'}`} testId={`${section}-item`}>{(item, index, update) => <ItemFields item={item} index={index} onChange={update} />}</RepeatableList></SectionCard>;
  }
  if (section === 'projects') return <SectionCard eyebrow="Selected work / 06" title="Projects" description="Project records can be presented as illustrative sector views when they are not client claims."><TwoColumnFields><Field label="Eyebrow" value={content.projects.eyebrow} onChange={(value) => set('projects', { ...content.projects, eyebrow: value })} testId="input-projects-eyebrow" /><Field label="Note" value={content.projects.note} onChange={(value) => set('projects', { ...content.projects, note: value })} multiline testId="input-projects-note" /><Field label="Title" value={content.projects.title} onChange={(value) => set('projects', { ...content.projects, title: value })} testId="input-projects-title" /><Field label="Title emphasis" value={content.projects.titleEmphasis} onChange={(value) => set('projects', { ...content.projects, titleEmphasis: value })} testId="input-projects-title-emphasis" /></TwoColumnFields><Subheading>Project entries</Subheading><RepeatableList items={content.projects.items} createItem={() => ({ title: 'A considered possibility.', category: 'Sector', location: 'Location', description: '', image: '', illustrative: true })} onChange={(items) => set('projects', { ...content.projects, items })} addLabel="Add project" testId="project-item">{(item, index, update) => <ItemFields item={item} index={index} onChange={update} project />}</RepeatableList></SectionCard>;
  if (section === 'approach') return <SectionCard eyebrow="How we work / 07" title="Approach" description="A short operating rhythm that makes the company’s point of view tangible."><TwoColumnFields><Field label="Eyebrow" value={content.approach.eyebrow} onChange={(value) => set('approach', { ...content.approach, eyebrow: value })} testId="input-approach-eyebrow" /><Field label="Intro" value={content.approach.intro} onChange={(value) => set('approach', { ...content.approach, intro: value })} multiline testId="input-approach-intro" /><Field label="Title" value={content.approach.title} onChange={(value) => set('approach', { ...content.approach, title: value })} testId="input-approach-title" /><Field label="Title emphasis" value={content.approach.titleEmphasis} onChange={(value) => set('approach', { ...content.approach, titleEmphasis: value })} testId="input-approach-title-emphasis" /></TwoColumnFields><Subheading>Steps</Subheading><RepeatableList items={content.approach.steps} createItem={() => ({ number: String(content.approach.steps.length + 1).padStart(2, '0'), title: 'NEXT', copy: '' })} onChange={(steps) => set('approach', { ...content.approach, steps })} addLabel="Add approach step" testId="approach-step">{(item, index, update) => <div className="grid gap-4 sm:grid-cols-[100px_1fr]"><Field label="Number" value={item.number} onChange={(value) => update({ ...item, number: value })} testId={`input-approach-step-${index}-number`} /><div className="space-y-4"><Field label="Title" value={item.title} onChange={(value) => update({ ...item, title: value })} testId={`input-approach-step-${index}-title`} /><Field label="Copy" value={item.copy} onChange={(value) => update({ ...item, copy: value })} multiline testId={`input-approach-step-${index}-copy`} /></div></div>}</RepeatableList></SectionCard>;
  if (section === 'partners') return <SectionCard eyebrow="Trusted by / 08" title="Partners" description="Add verified names, logos and links. Keep the empty message accurate when the list is intentionally blank."><TwoColumnFields><Field label="Eyebrow" value={content.partners.eyebrow} onChange={(value) => set('partners', { ...content.partners, eyebrow: value })} testId="input-partners-eyebrow" /><Field label="Note" value={content.partners.note} onChange={(value) => set('partners', { ...content.partners, note: value })} multiline testId="input-partners-note" /><Field label="Title" value={content.partners.title} onChange={(value) => set('partners', { ...content.partners, title: value })} testId="input-partners-title" /><Field label="Title emphasis" value={content.partners.titleEmphasis} onChange={(value) => set('partners', { ...content.partners, titleEmphasis: value })} testId="input-partners-title-emphasis" /><Field label="Empty message" value={content.partners.emptyMessage} onChange={(value) => set('partners', { ...content.partners, emptyMessage: value })} multiline testId="input-partners-empty-message" /></TwoColumnFields><Subheading>Partner entries</Subheading><RepeatableList items={content.partners.items} createItem={() => ({ name: 'Partner name', logo: '', url: '' })} onChange={(items) => set('partners', { ...content.partners, items })} addLabel="Add partner" testId="partner-item">{(item, index, update) => <TwoColumnFields><Field label="Name" value={item.name} onChange={(value) => update({ ...item, name: value })} testId={`input-partner-${index}-name`} /><Field label="Logo URL / path" value={item.logo} onChange={(value) => update({ ...item, logo: value })} testId={`input-partner-${index}-logo`} /><Field label="Website URL" value={item.url} onChange={(value) => update({ ...item, url: value })} testId={`input-partner-${index}-url`} /></TwoColumnFields>}</RepeatableList></SectionCard>;
  if (section === 'values') return <SectionCard eyebrow="Why Catus Synergy / 09" title="Values" description="These words create the repeated cadence of the public brand."><TwoColumnFields><Field label="Eyebrow" value={content.values.eyebrow} onChange={(value) => set('values', { ...content.values, eyebrow: value })} testId="input-values-eyebrow" /><Field label="Intro" value={content.values.intro} onChange={(value) => set('values', { ...content.values, intro: value })} multiline testId="input-values-intro" /><Field label="Title" value={content.values.title} onChange={(value) => set('values', { ...content.values, title: value })} testId="input-values-title" /><Field label="Title emphasis" value={content.values.titleEmphasis} onChange={(value) => set('values', { ...content.values, titleEmphasis: value })} testId="input-values-title-emphasis" /></TwoColumnFields><Subheading>Values list</Subheading><RepeatableList items={content.values.items} createItem={() => 'New value'} onChange={(items) => set('values', { ...content.values, items })} addLabel="Add value" testId="value">{(item, index, update) => <Field label={`Value ${String(index + 1).padStart(2, '0')}`} value={item} onChange={update} testId={`input-value-${index}`} />}</RepeatableList></SectionCard>;
  if (section === 'leadership') return <SectionCard eyebrow="Point of view / 10" title="Leadership" description="Keep this introduction human, direct and current."><TwoColumnFields><Field label="Eyebrow" value={content.leadership.eyebrow} onChange={(value) => set('leadership', { ...content.leadership, eyebrow: value })} testId="input-leadership-eyebrow" /><Field label="Name" value={content.leadership.name} onChange={(value) => set('leadership', { ...content.leadership, name: value })} testId="input-leadership-name" /><Field label="Title" value={content.leadership.title} onChange={(value) => set('leadership', { ...content.leadership, title: value })} testId="input-leadership-title" /><Field label="Title emphasis" value={content.leadership.titleEmphasis} onChange={(value) => set('leadership', { ...content.leadership, titleEmphasis: value })} testId="input-leadership-title-emphasis" /><Field label="Role" value={content.leadership.role} onChange={(value) => set('leadership', { ...content.leadership, role: value })} testId="input-leadership-role" /><Field label="Portrait URL / path" value={content.leadership.portraitUrl} onChange={(value) => set('leadership', { ...content.leadership, portraitUrl: value })} testId="input-leadership-portrait" /><Field label="Statement" value={content.leadership.statement} onChange={(value) => set('leadership', { ...content.leadership, statement: value })} multiline testId="input-leadership-statement" /></TwoColumnFields></SectionCard>;
  if (section === 'contact') return <SectionCard eyebrow="Start a conversation / 11" title="Contact" description="The details people use to reach Catus Synergy from the public site."><TwoColumnFields><Field label="Eyebrow" value={content.contact.eyebrow} onChange={(value) => set('contact', { ...content.contact, eyebrow: value })} testId="input-contact-eyebrow" /><Field label="Headline" value={content.contact.headline} onChange={(value) => set('contact', { ...content.contact, headline: value })} multiline testId="input-contact-headline" /><Field label="Email" value={content.contact.email} onChange={(value) => set('contact', { ...content.contact, email: value })} testId="input-contact-email" /><Field label="Phone" value={content.contact.phone} onChange={(value) => set('contact', { ...content.contact, phone: value })} testId="input-contact-phone" /><Field label="Location" value={content.contact.location} onChange={(value) => set('contact', { ...content.contact, location: value })} testId="input-contact-location" /><Field label="Social handle" value={content.contact.socialHandle} onChange={(value) => set('contact', { ...content.contact, socialHandle: value })} testId="input-contact-social-handle" /><Field label="Social URL" value={content.contact.socialUrl} onChange={(value) => set('contact', { ...content.contact, socialUrl: value })} testId="input-contact-social-url" /><Field label="CTA label" value={content.contact.cta} onChange={(value) => set('contact', { ...content.contact, cta: value })} testId="input-contact-cta" /></TwoColumnFields></SectionCard>;
  if (section === 'footer') return <SectionCard eyebrow="Closing frame / 12" title="Footer" description="The final details repeated at the bottom of the public page."><TwoColumnFields><Field label="Tagline" value={content.footer.tagline} onChange={(value) => set('footer', { ...content.footer, tagline: value })} testId="input-footer-tagline" /><Field label="Navigate label" value={content.footer.navigateLabel} onChange={(value) => set('footer', { ...content.footer, navigateLabel: value })} testId="input-footer-navigate-label" /><Field label="Contact label" value={content.footer.contactLabel} onChange={(value) => set('footer', { ...content.footer, contactLabel: value })} testId="input-footer-contact-label" /></TwoColumnFields></SectionCard>;
  return null;
}

function EditorShell({ initialContent, username, onLogout }: { initialContent: SiteContent; username: string | null; onLogout: () => void }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [section, setSection] = useState<SectionKey>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const update = useUpdateSiteContent();
  const logout = useLogoutAdmin();
  const originalRef = useRef(JSON.stringify(initialContent));

  useEffect(() => {
    setDirty(JSON.stringify(content) !== originalRef.current);
  }, [content]);

  const active = useMemo(() => sections.find((item) => item.key === section) ?? sections[0], [section]);
  const changeSection = (next: SectionKey) => {
    setSection(next);
    setMobileNav(false);
    setNotice(null);
  };
  const save = () => {
    setNotice(null);
    update.mutate({ data: { content } }, {
      onSuccess: () => {
        originalRef.current = JSON.stringify(content);
        setDirty(false);
        setNotice({ tone: 'success', message: 'The public content snapshot is saved.' });
        void queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
      },
      onError: (reason) => setNotice({ tone: 'error', message: getErrorMessage(reason, 'The content could not be saved. Your edits are still here.') }),
    });
  };
  const signOut = () => logout.mutate(undefined, { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getGetAdminStatusQueryKey() }); onLogout(); } });

  return (
    <div className="min-h-[100dvh] bg-[#eef1f7] text-[#172039]">
      <header className="sticky top-0 z-30 border-b border-[#dce1eb] bg-[#f8f9fc]/95 backdrop-blur">
        <div className="flex h-[74px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? 'Close section menu' : 'Open section menu'} data-testid="button-toggle-admin-menu" className="inline-flex h-10 w-10 items-center justify-center border border-[#d5dae5] bg-[#fffefe] text-[#1f3fb7] lg:hidden">{mobileNav ? <X size={17} /> : <Menu size={17} />}</button>
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center bg-[#162675] text-white"><Sparkles size={15} /></div><div><p className="display text-[21px] leading-none tracking-[-0.05em] text-[#172039]">Catus Synergy</p><p className="mt-1 font-mono-brand text-[8px] uppercase tracking-[0.16em] text-[#778198]">Content room</p></div></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 text-xs text-[#697186] sm:flex"><span className="h-2 w-2 rounded-full bg-[#3e9a68]" />Signed in as <strong className="font-medium text-[#35405b]">{username ?? 'operator'}</strong></div><AdminInstallButton /><a href="/" target="_blank" rel="noreferrer" data-testid="link-view-public-site" className="inline-flex h-10 items-center gap-2 border border-[#d5dae5] bg-[#fffefe] px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#35405b] hover:border-[#9eadd1]"><Eye size={14} /> <span className="hidden sm:inline">View site</span></a><ActionButton onClick={signOut} disabled={logout.isPending} variant="quiet" testId="button-admin-logout"><LogOut size={14} /><span className="hidden sm:inline">Sign out</span></ActionButton></div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside className={`${mobileNav ? 'block' : 'hidden'} fixed inset-x-0 top-[74px] z-20 max-h-[calc(100dvh-74px)] overflow-y-auto border-b border-[#dce1eb] bg-[#f8f9fc] p-4 lg:sticky lg:top-[74px] lg:block lg:h-[calc(100dvh-74px)] lg:w-[286px] lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5`}>
          <div className="mb-4 px-3"><p className="font-mono-brand text-[9px] uppercase tracking-[0.17em] text-[#81899a]">Edit sections</p><p className="mt-2 text-xs leading-5 text-[#697186]">One complete story, kept current.</p></div>
          <nav className="space-y-1" aria-label="Admin content sections">
            {sections.map((item, index) => <button type="button" key={item.key} onClick={() => changeSection(item.key)} aria-current={section === item.key ? 'page' : undefined} data-testid={`button-section-${item.key}`} className={`group flex w-full items-center gap-3 rounded-[2px] px-3 py-3 text-left transition-colors ${section === item.key ? 'bg-[#e0e7ff] text-[#162675]' : 'text-[#5f697e] hover:bg-[#edf1f8] hover:text-[#172039]'}`}><span className={`w-5 font-mono-brand text-[9px] ${section === item.key ? 'text-[#1f3fb7]' : 'text-[#9aa2b2]'}`}>{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-[#8a92a4]">{item.detail}</span></span>{section === item.key ? <ChevronRight size={14} /> : null}</button>)}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 sm:py-10 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-[1040px]">
            <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#d9dee8] pb-6 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 font-mono-brand text-[10px] uppercase tracking-[0.15em] text-[#8a92a4]"><LayoutDashboard size={13} className="text-[#1f3fb7]" /> Admin / <span className="text-[#1f3fb7]">{active.label}</span></div><h1 className="display mt-3 text-[clamp(2.2rem,5vw,4rem)] leading-none tracking-[-0.06em] text-[#172039]">{active.label}</h1></div>{section === 'email' ? <p className="max-w-sm text-xs leading-5 text-[#697186]">Connect the company mailbox to read, reply to, and send email.</p> : <div className="flex items-center gap-3"><span className={`text-xs ${dirty ? 'text-[#a06a32]' : 'text-[#6b8a76]'}`}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span><ActionButton onClick={save} disabled={!dirty || update.isPending} testId="button-save-content"><Save size={14} />{update.isPending ? 'Saving…' : 'Save changes'}</ActionButton></div>}</div>
            {notice ? <div className="mb-6"><StatusMessage tone={notice.tone} message={notice.message} testId={`status-content-${notice.tone}`} /></div> : null}
            {section === 'email' ? <AdminEmail /> : <ContentEditor section={section} content={content} setContent={setContent} onSelect={changeSection} />}
            {section === 'overview' ? <div className="mt-6 flex justify-end"><ActionButton onClick={save} disabled={!dirty || update.isPending} testId="button-save-overview"><Save size={14} /> Save changes</ActionButton></div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading, isError: statusError } = useGetAdminStatus();
  const { data: snapshot, isLoading: contentLoading, isError: contentError } = useGetSiteContent();
  const [sessionBump, setSessionBump] = useState(0);
  const content = snapshot?.content ?? defaultSiteContent;
  if (statusLoading || contentLoading) return <LoadingView />;
  if (statusError) return <ErrorView message="We could not confirm the current admin session. Try again when the connection is ready." onRetry={() => { void queryClient.invalidateQueries({ queryKey: getGetAdminStatusQueryKey() }); }} />;
  if (contentError) return <ErrorView message="We could not load the saved website content. No content has been changed." onRetry={() => { void queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() }); }} />;
  if (!status?.authenticated) return <LoginView onLoggedIn={() => { setSessionBump((value) => value + 1); void queryClient.invalidateQueries({ queryKey: getGetAdminStatusQueryKey() }); }} />;
  if (status.mustChangePassword) return <PasswordChangeView username={status.username} onChanged={() => { setSessionBump((value) => value + 1); void queryClient.invalidateQueries({ queryKey: getGetAdminStatusQueryKey() }); }} />;
  return <div key={sessionBump}><EditorShell initialContent={content} username={status.username} onLogout={() => { setSessionBump((value) => value + 1); void queryClient.invalidateQueries({ queryKey: getGetAdminStatusQueryKey() }); }} /></div>;
}

function LoadingView() {
  return <main className="min-h-[100dvh] bg-[#eef1f7] p-5 sm:p-10" data-testid="status-admin-loading"><div className="mx-auto max-w-[1180px] animate-pulse"><div className="h-16 w-56 bg-[#dce2ef]" /><div className="mt-12 grid gap-5 lg:grid-cols-[280px_1fr]"><div className="h-[620px] bg-[#e2e7f0]" /><div className="space-y-5"><div className="h-32 bg-[#e2e7f0]" /><div className="h-[440px] bg-[#e2e7f0]" /></div></div></div></main>;
}

function ErrorView({ onRetry, message }: { onRetry: () => void; message: string }) {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#eef1f7] px-5" data-testid="status-admin-error"><div className="max-w-[440px] rounded-[3px] border border-[#efc9c7] bg-[#fffefe] p-8 text-center shadow-[0_20px_60px_rgba(30,48,91,0.08)]"><CircleAlert size={28} className="mx-auto text-[#a34643]" /><h1 className="display mt-5 text-4xl tracking-[-0.06em]">The room is unavailable.</h1><p className="mt-3 text-sm leading-6 text-[#697186]">{message}</p><div className="mt-7 flex justify-center"><ActionButton onClick={onRetry} testId="button-retry-admin">Try again <ArrowRight size={14} /></ActionButton></div></div></main>;
}