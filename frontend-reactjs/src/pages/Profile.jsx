import { Fragment, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import SegmentedControl from '../components/ui/SegmentedControl.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useSession } from '../hooks/useSession.js';
import { useProfile } from '../hooks/useProfile.js';

const ROLE_LABELS = Object.freeze({
  user: 'Member',
  serviceman: 'Crew',
  provider: 'Provider',
  enterprise: 'Enterprise',
  finance: 'Finance',
  admin: 'Admin',
  operations: 'Operations'
});

const BUSINESS_LINK_FALLBACK = '/providers';
const SHOP_LINK_FALLBACK = '/provider/storefront';
const CREW_LINK_FALLBACK = '/dashboards/serviceman';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function extractLocation(address) {
  if (!address || typeof address !== 'string') {
    return null;
  }

  const lines = address
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  if (lines.length === 1) {
    return lines[0];
  }

  const [city, country] = lines.slice(-2);
  return [city, country].filter(Boolean).join(', ');
}

function formatName(firstName, lastName, email) {
  const safeFirst = typeof firstName === 'string' ? firstName.trim() : '';
  const safeLast = typeof lastName === 'string' ? lastName.trim() : '';

  if (safeFirst || safeLast) {
    return [safeFirst, safeLast].filter(Boolean).join(' ');
  }

  if (typeof email === 'string' && email.trim()) {
    return email.trim();
  }

  return 'Profile';
}

export default function Profile() {
  const session = useSession();
  const { profile, isLoading } = useProfile();
  const [activeView, setActiveView] = useState('profile');
  const [shared, setShared] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);

  const fullName = useMemo(
    () => formatName(profile?.firstName, profile?.lastName, profile?.email ?? session?.userId),
    [profile?.email, profile?.firstName, profile?.lastName, session?.userId]
  );

  const personaHeadline = useMemo(() => {
    const title = typeof profile?.jobTitle === 'string' ? profile.jobTitle.trim() : '';
    const team = typeof profile?.teamName === 'string' ? profile.teamName.trim() : '';

    return [title, team].filter(Boolean).join(' • ');
  }, [profile?.jobTitle, profile?.teamName]);

  const locationLabel = useMemo(() => extractLocation(profile?.address), [profile?.address]);

  const primaryRole = useMemo(() => {
    const assigned = ensureArray(profile?.roleAssignments);
    if (assigned.length > 0) {
      const label = ROLE_LABELS[assigned[0].role] ?? assigned[0].role;
      return label;
    }

    const dashboards = ensureArray(session?.dashboards);
    if (dashboards.length > 0) {
      return ROLE_LABELS[dashboards[0]] ?? dashboards[0];
    }

    return null;
  }, [profile?.roleAssignments, session?.dashboards]);

  const badges = useMemo(() => {
    const items = [];
    if (profile?.organisation) {
      items.push(profile.organisation);
    }
    if (primaryRole) {
      items.push(primaryRole);
    }
    if (profile?.timezone) {
      items.push(profile.timezone);
    }
    return items;
  }, [primaryRole, profile?.organisation, profile?.timezone]);

  const workspaceShortcuts = useMemo(() => ensureArray(profile?.workspaceShortcuts), [profile?.workspaceShortcuts]);
  const dashboards = useMemo(() => ensureArray(session?.dashboards), [session?.dashboards]);

  const businessLinks = useMemo(() => {
    const businessHref = profile?.businessFrontUrl || BUSINESS_LINK_FALLBACK;
    const shopHref = profile?.shopFrontUrl || SHOP_LINK_FALLBACK;
    return { businessHref, shopHref };
  }, [profile?.businessFrontUrl, profile?.shopFrontUrl]);

  const crewAssignments = useMemo(
    () => ensureArray(profile?.roleAssignments).filter((assignment) => assignment.role === 'serviceman'),
    [profile?.roleAssignments]
  );

  const hasBusiness = Boolean(profile?.organisation);
  const hasCrew = crewAssignments.length > 0 || dashboards.includes('serviceman');
  const hasServiceView = hasCrew || Boolean(profile?.serviceBookingUrl || profile?.crewPortalUrl);

  const personaTabs = useMemo(() => {
    const base = [{ value: 'profile', label: 'Info' }];
    if (hasBusiness) {
      base.push({ value: 'business', label: 'Business' });
    }
    if (hasServiceView) {
      base.push({ value: 'crew', label: 'Service' });
    }
    return base;
  }, [hasBusiness, hasServiceView]);

  const serviceLinks = useMemo(() => {
    const primary = profile?.crewPortalUrl || CREW_LINK_FALLBACK;
    const booking = profile?.serviceBookingUrl || '/checkout';
    return { primary, booking };
  }, [profile?.crewPortalUrl, profile?.serviceBookingUrl]);

  const bio = useMemo(() => {
    if (typeof profile?.bio === 'string' && profile.bio.trim()) {
      return profile.bio.trim();
    }
    if (typeof profile?.signature === 'string' && profile.signature.trim()) {
      return profile.signature.trim();
    }
    return null;
  }, [profile?.bio, profile?.signature]);

  const uniqueWorkspaces = useMemo(
    () => [...new Set([...workspaceShortcuts, ...dashboards])],
    [dashboards, workspaceShortcuts]
  );

  const bioPreview = useMemo(() => {
    if (!bio) {
      return null;
    }
    if (bio.length <= 160) {
      return bio;
    }
    return `${bio.slice(0, 160)}…`;
  }, [bio]);

  const handleShare = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: fullName, url });
        setShared(true);
        setTimeout(() => setShared(false), 2400);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2400);
      }
    } catch (error) {
      console.warn('[Profile] share failed', error);
    }
  }, [fullName]);

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-100 to-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_70%)]" aria-hidden="true" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-8 pb-16 pt-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${fullName} avatar`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-5xl font-semibold uppercase text-primary">
                    {fullName.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{fullName}</h1>
                  {personaHeadline ? <p className="text-base font-medium text-slate-600">{personaHeadline}</p> : null}
                  {locationLabel ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-primary">
                      <MapPinIcon className="h-5 w-5" aria-hidden="true" />
                      {locationLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/communications?compose=profile"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary/90"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" /> Chat
              </Link>
              <Link
                to={serviceLinks.booking}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-accent/90"
              >
                <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" /> Book
              </Link>
              {hasBusiness ? (
                <Link
                  to={businessLinks.businessHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg transition hover:bg-slate-100"
                >
                  <BuildingOffice2Icon className="h-5 w-5" aria-hidden="true" /> Company
                </Link>
              ) : null}
              {hasBusiness ? (
                <Link
                  to={businessLinks.shopHref}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                >
                  <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" /> Shop
                </Link>
              ) : null}
              {hasServiceView ? (
                <Link
                  to={serviceLinks.primary}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg transition hover:bg-slate-100"
                >
                  <UsersIcon className="h-5 w-5" aria-hidden="true" /> Team
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleShare}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border border-primary/30 px-5 py-3 text-sm font-semibold transition',
                  shared ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'
                )}
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                {shared ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          {personaTabs.length > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/90 px-4 py-3 shadow-md">
              <SegmentedControl
                name="Profile views"
                value={activeView}
                options={personaTabs}
                onChange={(value) => {
                  setActiveView(value);
                  setBioOpen(false);
                }}
                className="w-full max-w-md"
              />
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-primary/80">
                {hasBusiness ? <span className="rounded-full bg-primary/10 px-3 py-1">Business</span> : null}
                {hasServiceView ? <span className="rounded-full bg-primary/10 px-3 py-1">Service</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-8 py-16">
        {activeView === 'profile' ? (
          <div className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="grid gap-10">
              {bio ? (
                <article className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur">
                  <header className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-primary">Bio</h2>
                    <button
                      type="button"
                      onClick={() => setBioOpen(true)}
                      className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-primary/90"
                    >
                      Open
                    </button>
                  </header>
                  <p className="mt-5 text-base leading-relaxed text-slate-600">{bioPreview}</p>
                </article>
              ) : null}

              {uniqueWorkspaces.length > 0 ? (
                <article className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur">
                  <header className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-primary">Work</h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Access</span>
                  </header>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {uniqueWorkspaces.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-primary"
                      >
                        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
                        {ROLE_LABELS[item] ?? item}
                      </span>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>

            <div className="grid gap-10">
              {(profile?.email || profile?.phone || profile?.timezone) && (
                <article className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur">
                  <h2 className="text-lg font-semibold text-primary">Contact</h2>
                  <div className="mt-6 grid gap-4">
                    {profile?.email ? (
                      <a
                        href={`mailto:${profile.email}`}
                        className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="inline-flex items-center gap-3">
                          <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
                          Mail
                        </span>
                        <span>{profile.email}</span>
                      </a>
                    ) : null}
                    {profile?.phone ? (
                      <a
                        href={`tel:${profile.phone}`}
                        className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="inline-flex items-center gap-3">
                          <PhoneIcon className="h-5 w-5" aria-hidden="true" />
                          Call
                        </span>
                        <span>{profile.phone}</span>
                      </a>
                    ) : null}
                    {profile?.timezone ? (
                      <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-primary">
                        <span className="inline-flex items-center gap-3">
                          <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
                          Zone
                        </span>
                        <span>{profile.timezone}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              )}

              {ensureArray(profile?.roleAssignments).length > 0 ? (
                <article className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-lg backdrop-blur">
                  <h2 className="text-lg font-semibold text-primary">Teams</h2>
                  <div className="mt-6 space-y-4">
                    {ensureArray(profile.roleAssignments).map((assignment) => (
                      <div key={assignment.id || assignment.role} className="rounded-2xl bg-slate-100 px-5 py-4">
                        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-primary">
                          <span className="inline-flex items-center gap-2">
                            <UsersIcon className="h-5 w-5" aria-hidden="true" />
                            {ROLE_LABELS[assignment.role] ?? assignment.role}
                          </span>
                          {assignment.allowCreate ? (
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                              Create
                            </span>
                          ) : null}
                        </div>
                        {ensureArray(assignment.dashboards).length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-primary">
                            {ensureArray(assignment.dashboards).map((dashboard) => (
                              <span
                                key={`${assignment.id || assignment.role}-${dashboard}`}
                                className="rounded-full bg-white px-3 py-1"
                              >
                                {ROLE_LABELS[dashboard] ?? dashboard}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeView === 'business' && hasBusiness ? (
          <div className="grid gap-10 xl:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
              <h2 className="text-lg font-semibold text-primary">Company</h2>
              <div className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-100 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Name</p>
                  <p className="mt-2 text-lg font-semibold text-primary">{profile.organisation}</p>
                </div>
                {profile?.teamName ? (
                  <div className="rounded-2xl bg-slate-100 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Team</p>
                    <p className="mt-2 text-lg font-semibold text-primary">{profile.teamName}</p>
                  </div>
                ) : null}
                {profile?.jobTitle ? (
                  <div className="rounded-2xl bg-slate-100 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Role</p>
                    <p className="mt-2 text-lg font-semibold text-primary">{profile.jobTitle}</p>
                  </div>
                ) : null}
                {locationLabel ? (
                  <div className="rounded-2xl bg-slate-100 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Location</p>
                    <p className="mt-2 text-lg font-semibold text-primary">{locationLabel}</p>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
              <h2 className="text-lg font-semibold text-primary">Links</h2>
              <div className="mt-6 flex flex-col gap-4">
                <Link
                  to={businessLinks.businessHref}
                  className="inline-flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10 hover:text-primary"
                >
                  <span className="inline-flex items-center gap-3">
                    <BuildingOffice2Icon className="h-6 w-6" aria-hidden="true" />
                    Company
                  </span>
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to={businessLinks.shopHref}
                  className="inline-flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  <span className="inline-flex items-center gap-3">
                    <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    Shop
                  </span>
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        ) : null}

        {activeView === 'crew' && hasServiceView ? (
          <div className="grid gap-10 xl:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
              <h2 className="text-lg font-semibold text-primary">Service</h2>
              <div className="mt-6 space-y-4">
                {crewAssignments.length > 0 ? (
                  crewAssignments.map((assignment) => (
                    <div key={assignment.id || assignment.role} className="rounded-2xl bg-slate-100 px-4 py-4">
                      <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                        <UsersIcon className="h-5 w-5" aria-hidden="true" />
                        {ROLE_LABELS[assignment.role] ?? assignment.role}
                      </div>
                      {ensureArray(assignment.dashboards).length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-primary">
                          {ensureArray(assignment.dashboards).map((dashboard) => (
                            <span key={`${assignment.id || assignment.role}-crew-${dashboard}`} className="rounded-full bg-white px-3 py-1">
                              {ROLE_LABELS[dashboard] ?? dashboard}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-100 px-4 py-6 text-sm font-semibold text-primary">Enabled</div>
                )}
              </div>
            </article>

            <article className="rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
              <h2 className="text-lg font-semibold text-primary">Tools</h2>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to={serviceLinks.primary}
                  className="inline-flex items-center justify-between gap-4 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10 hover:text-primary"
                >
                  <span className="inline-flex items-center gap-3">
                    <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
                    Console
                  </span>
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to={serviceLinks.booking}
                  className="inline-flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  <span className="inline-flex items-center gap-3">
                    <CalendarDaysIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    Bookings
                  </span>
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        ) : null}
      </section>

      {bio && (
        <Transition show={bioOpen} as={Fragment}>
          <Dialog as="div" className="relative z-40" onClose={() => setBioOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center px-4 py-12">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-150"
                  enterFrom="opacity-0 translate-y-4"
                  enterTo="opacity-100 translate-y-0"
                  leave="ease-in duration-100"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-4"
                >
                  <Dialog.Panel className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl">
                    <Dialog.Title className="text-xl font-semibold text-primary">Bio</Dialog.Title>
                    <div className="mt-6 space-y-6">
                      <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">{bio}</p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setBioOpen(false)}
                          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </main>
  );
}
