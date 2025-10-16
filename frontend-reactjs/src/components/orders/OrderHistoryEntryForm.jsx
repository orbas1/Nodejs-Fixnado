import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  PlusIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button.jsx';
import TextInput from '../ui/TextInput.jsx';
import SegmentedControl from '../ui/SegmentedControl.jsx';
import {
  ORDER_HISTORY_ENTRY_TYPES,
  ORDER_HISTORY_STATUSES,
  ORDER_HISTORY_ACTOR_ROLES,
  ORDER_HISTORY_ATTACHMENT_TYPES
} from '../../constants/orderHistory.js';

const buildDatetimeLocal = (value) => {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoString = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const normaliseOptions = (options, fallback) => {
  if (Array.isArray(options) && options.every((item) => item && typeof item === 'object')) {
    return options;
  }
  return fallback;
};

const normaliseAttachmentTypes = (attachmentConfig) => {
  if (!attachmentConfig) {
    return ORDER_HISTORY_ATTACHMENT_TYPES;
  }
  if (Array.isArray(attachmentConfig.acceptedTypes) && attachmentConfig.acceptedTypes.length > 0) {
    return attachmentConfig.acceptedTypes;
  }
  return ORDER_HISTORY_ATTACHMENT_TYPES;
};

const DEFAULT_ENTRY = {
  title: '',
  entryType: ORDER_HISTORY_ENTRY_TYPES[0].value,
  status: ORDER_HISTORY_STATUSES[0].value,
  summary: '',
  actorRole: ORDER_HISTORY_ACTOR_ROLES[0].value,
  actorId: '',
  occurredAt: buildDatetimeLocal(new Date()),
  attachments: [],
  meta: []
};

const createRowId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `row-${Math.random().toString(36).slice(2, 10)}`;

const buildFormState = (entry = null, entryTypes, actorRoles) => {
  if (!entry) {
    return { ...DEFAULT_ENTRY, entryType: entryTypes[0]?.value ?? DEFAULT_ENTRY.entryType, actorRole: actorRoles[0]?.value ?? DEFAULT_ENTRY.actorRole };
  }

  const attachments = Array.isArray(entry.attachments)
    ? entry.attachments.map((attachment) => ({
        id: attachment.id ?? null,
        key: createRowId(),
        label: attachment.label ?? '',
        url: attachment.url ?? '',
        type: attachment.type ?? ORDER_HISTORY_ATTACHMENT_TYPES[0],
        description: attachment.description ?? '',
        previewImage: attachment.previewImage ?? ''
      }))
    : [];

  const metaEntries = entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
    ? Object.entries(entry.meta).map(([key, value]) => ({ id: createRowId(), key, value: value === null || value === undefined ? '' : String(value) }))
    : [];

  return {
    title: entry.title ?? '',
    entryType: entry.entryType ?? entryTypes[0]?.value ?? DEFAULT_ENTRY.entryType,
    status: entry.status ?? ORDER_HISTORY_STATUSES[0].value,
    summary: entry.summary ?? '',
    actorRole: entry.actorRole ?? actorRoles[0]?.value ?? DEFAULT_ENTRY.actorRole,
    actorId: entry.actorId ?? '',
    occurredAt: buildDatetimeLocal(entry.occurredAt ?? entry.createdAt ?? new Date()),
    attachments,
    meta: metaEntries
  };
};

const validatePayload = (values) => {
  const errors = {};

  if (!values.title || !values.title.trim()) {
    errors.title = 'Title is required';
  }

  if (!values.occurredAt) {
    errors.occurredAt = 'Timeline date and time is required';
  }

  values.attachments.forEach((attachment, index) => {
    if (attachment.url && !/^https?:\/\//i.test(attachment.url)) {
      errors[`attachment-${attachment.key}`] = 'Attachment URL must start with http or https';
    }
    if (!attachment.url && (attachment.label || attachment.description || attachment.previewImage)) {
      errors[`attachment-${attachment.key}`] = 'Attachment URL is required when other fields are provided';
    }
  });

  values.meta.forEach((entry) => {
    if (!entry.key && entry.value) {
      errors[`meta-${entry.id}`] = 'Provide a key for this metadata entry';
    }
  });

  return errors;
};

const serialiseAttachments = (attachments) =>
  attachments
    .filter((attachment) => attachment.url && attachment.url.trim())
    .map((attachment) => ({
      id: attachment.id ?? attachment.key,
      label: attachment.label?.trim() || attachment.url.trim(),
      url: attachment.url.trim(),
      type: attachment.type || ORDER_HISTORY_ATTACHMENT_TYPES[0],
      description: attachment.description?.trim() || null,
      previewImage: attachment.previewImage?.trim() || null
    }));

const serialiseMeta = (meta) => {
  if (!Array.isArray(meta)) {
    return {};
  }

  return meta.reduce((acc, entry) => {
    const key = entry.key?.trim();
    if (!key) {
      return acc;
    }
    acc[key] = entry.value ?? '';
    return acc;
  }, {});
};

const attachmentTypeLabel = {
  image: 'Image',
  document: 'Document',
  link: 'Link'
};

const renderAttachmentTypeLabel = (value) => attachmentTypeLabel[value] ?? value;

const metadataHint =
  'Add optional metadata as key-value pairs so operations, finance, and compliance teams can filter and export notes.';

function OrderHistoryEntryForm({
  mode,
  entry,
  entryTypes,
  actorRoles,
  statusOptions,
  attachmentConfig,
  submitting,
  error,
  onSubmit,
  onCancel,
  defaultActorId
}) {
  const resolvedEntryTypes = useMemo(() => normaliseOptions(entryTypes, ORDER_HISTORY_ENTRY_TYPES), [entryTypes]);
  const resolvedActorRoles = useMemo(() => normaliseOptions(actorRoles, ORDER_HISTORY_ACTOR_ROLES), [actorRoles]);
  const resolvedStatuses = useMemo(() => normaliseOptions(statusOptions, ORDER_HISTORY_STATUSES), [statusOptions]);
  const acceptedAttachmentTypes = useMemo(() => normaliseAttachmentTypes(attachmentConfig), [attachmentConfig]);
  const maxAttachments = attachmentConfig?.maxPerEntry ?? 6;

  const [values, setValues] = useState(() => buildFormState(entry, resolvedEntryTypes, resolvedActorRoles));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(buildFormState(entry, resolvedEntryTypes, resolvedActorRoles));
    setErrors({});
  }, [entry, resolvedEntryTypes, resolvedActorRoles]);

  useEffect(() => {
    if (!entry && defaultActorId && !values.actorId) {
      setValues((prev) => ({ ...prev, actorId: defaultActorId }));
    }
  }, [defaultActorId, entry, values.actorId]);

  const handleChange = (field, nextValue) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleAttachmentChange = (key, field, nextValue) => {
    setValues((prev) => ({
      ...prev,
      attachments: prev.attachments.map((attachment) =>
        attachment.key === key ? { ...attachment, [field]: nextValue } : attachment
      )
    }));
  };

  const handleMetaChange = (rowId, field, nextValue) => {
    setValues((prev) => ({
      ...prev,
      meta: prev.meta.map((item) => (item.id === rowId ? { ...item, [field]: nextValue } : item))
    }));
  };

  const addAttachment = () => {
    setValues((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          id: null,
          key: createRowId(),
          label: '',
          url: '',
          type: acceptedAttachmentTypes[0] ?? 'link',
          description: '',
          previewImage: ''
        }
      ]
    }));
  };

  const removeAttachment = (key) => {
    setValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((attachment) => attachment.key !== key)
    }));
  };

  const addMetaEntry = () => {
    setValues((prev) => ({
      ...prev,
      meta: [...prev.meta, { id: createRowId(), key: '', value: '' }]
    }));
  };

  const removeMetaEntry = (rowId) => {
    setValues((prev) => ({
      ...prev,
      meta: prev.meta.filter((item) => item.id !== rowId)
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validatePayload(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      title: values.title.trim(),
      entryType: values.entryType,
      status: values.status,
      summary: values.summary?.trim() || null,
      actorRole: values.actorRole,
      actorId: values.actorId?.trim() || null,
      occurredAt: toIsoString(values.occurredAt) ?? new Date().toISOString(),
      attachments: serialiseAttachments(values.attachments),
      meta: serialiseMeta(values.meta)
    };

    onSubmit(payload);
  };

  const title = mode === 'edit' ? 'Edit history entry' : 'Add history entry';

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-label={title}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">
          Capture milestones, escalations, and operational notes in a structured format. Attach supporting links or images so
          finance, support, and compliance teams can act quickly.
        </p>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Title"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          required
          error={errors.title}
          placeholder="Crew arrival, escalation, completed milestone…"
        />

        <TextInput
          label="Occurred at"
          type="datetime-local"
          value={values.occurredAt}
          onChange={(event) => handleChange('occurredAt', event.target.value)}
          required
          error={errors.occurredAt}
        />

        <div className="sm:col-span-1">
          <p className="mb-2 text-sm font-medium text-slate-700">Entry type</p>
          <SegmentedControl
            name="Entry type"
            value={values.entryType}
            options={resolvedEntryTypes.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(next) => handleChange('entryType', next)}
            size="sm"
            className="bg-secondary"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="history-status">
            Status
          </label>
          <select
            id="history-status"
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {resolvedStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="history-actor-role">
            Actor role
          </label>
          <select
            id="history-actor-role"
            value={values.actorRole}
            onChange={(event) => handleChange('actorRole', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {resolvedActorRoles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <TextInput
          label="Actor ID"
          optionalLabel="Optional"
          value={values.actorId}
          onChange={(event) => handleChange('actorId', event.target.value)}
          placeholder="Who triggered this entry?"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="history-summary">
          Summary
        </label>
        <textarea
          id="history-summary"
          value={values.summary}
          onChange={(event) => handleChange('summary', event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Share the context, decisions taken, and any follow-up actions."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Attachments</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-slate-600">
              {values.attachments.length}/{maxAttachments}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={PlusIcon}
            disabled={values.attachments.length >= maxAttachments}
            onClick={addAttachment}
          >
            Add attachment
          </Button>
        </div>
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <InformationCircleIcon aria-hidden="true" className="mt-0.5 h-4 w-4" />
          Accepted types: {acceptedAttachmentTypes.map((type) => renderAttachmentTypeLabel(type)).join(', ')}
        </p>
        <div className="space-y-4">
          {values.attachments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-secondary/60 p-4 text-sm text-slate-500">
              Attach on-site photos, signed documents, or proof-of-service links so downstream teams have everything they need.
            </p>
          ) : null}
          {values.attachments.map((attachment) => (
            <div
              key={attachment.key}
              className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm"
              data-testid="history-attachment-row"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`attachment-type-${attachment.key}`}>
                      Type
                    </label>
                    <select
                      id={`attachment-type-${attachment.key}`}
                      value={attachment.type}
                      onChange={(event) => handleAttachmentChange(attachment.key, 'type', event.target.value)}
                      className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {acceptedAttachmentTypes.map((type) => (
                        <option key={type} value={type}>
                          {renderAttachmentTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[12rem] flex-1">
                    <TextInput
                      label="Label"
                      optionalLabel="Optional"
                      value={attachment.label}
                      onChange={(event) => handleAttachmentChange(attachment.key, 'label', event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  icon={TrashIcon}
                  onClick={() => removeAttachment(attachment.key)}
                  className="self-start"
                >
                  Remove
                </Button>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="URL"
                  value={attachment.url}
                  onChange={(event) => handleAttachmentChange(attachment.key, 'url', event.target.value)}
                  error={errors[`attachment-${attachment.key}`]}
                  placeholder="https://..."
                  required={Boolean(attachment.label || attachment.description || attachment.previewImage)}
                />
                <TextInput
                  label="Preview image"
                  optionalLabel="Optional"
                  value={attachment.previewImage}
                  onChange={(event) => handleAttachmentChange(attachment.key, 'previewImage', event.target.value)}
                  placeholder="https://..."
                />
                <div className="md:col-span-2">
                  <TextInput
                    label="Description"
                    optionalLabel="Optional"
                    value={attachment.description}
                    onChange={(event) => handleAttachmentChange(attachment.key, 'description', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Metadata</h3>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <InformationCircleIcon aria-hidden="true" className="h-4 w-4" />
              {metadataHint}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={addMetaEntry}>
            Add field
          </Button>
        </div>
        <div className="space-y-3">
          {values.meta.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-secondary/60 p-4 text-sm text-slate-500">
              Use metadata to track follow-up owners, escalation severity, contract references, or invoice IDs.
            </p>
          ) : null}
          {values.meta.map((item) => (
            <div key={item.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" data-testid="history-meta-row">
              <TextInput
                label="Key"
                value={item.key}
                onChange={(event) => handleMetaChange(item.id, 'key', event.target.value)}
                error={errors[`meta-${item.id}`]}
                placeholder="e.g. severity"
              />
              <TextInput
                label="Value"
                value={item.value}
                onChange={(event) => handleMetaChange(item.id, 'value', event.target.value)}
                placeholder="e.g. high"
              />
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                icon={ArrowUturnLeftIcon}
                className="mt-5"
                onClick={() => removeMetaEntry(item.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="tertiary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Add entry'}
        </Button>
      </div>
    </form>
  );
}

OrderHistoryEntryForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  entry: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    entryType: PropTypes.string,
    status: PropTypes.string,
    summary: PropTypes.string,
    actorRole: PropTypes.string,
    actorId: PropTypes.string,
    occurredAt: PropTypes.string,
    createdAt: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string,
        description: PropTypes.string,
        previewImage: PropTypes.string
      })
    ),
    meta: PropTypes.object
  }),
  entryTypes: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  actorRoles: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  statusOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  attachmentConfig: PropTypes.shape({
    acceptedTypes: PropTypes.arrayOf(PropTypes.string),
    maxPerEntry: PropTypes.number
  }),
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  defaultActorId: PropTypes.string
};

OrderHistoryEntryForm.defaultProps = {
  entry: null,
  entryTypes: ORDER_HISTORY_ENTRY_TYPES,
  actorRoles: ORDER_HISTORY_ACTOR_ROLES,
  statusOptions: ORDER_HISTORY_STATUSES,
  attachmentConfig: { acceptedTypes: ORDER_HISTORY_ATTACHMENT_TYPES, maxPerEntry: 6 },
  submitting: false,
  error: null,
  defaultActorId: ''
};

export default OrderHistoryEntryForm;
