import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  fetchCommandMetricsConfig,
  saveCommandMetricsSettings,
  createCommandMetricCard,
  updateCommandMetricCardRequest,
  deleteCommandMetricCardRequest
} from '../../api/commandMetricsClient.js';
import { Button, Spinner, StatusPill } from '../../components/ui/index.js';
import SummaryHighlightsPanel from './SummaryHighlightsPanel.jsx';
import MetricThresholdsPanel from './MetricThresholdsPanel.jsx';
import CustomCardsPanel from './CustomCardsPanel.jsx';
import {
  TONE_OPTIONS,
  buildInitialSettingsForm,
  buildFormState,
  buildSettingsPayload,
  normaliseCardForState,
  sortCards,
  buildCardDraft
} from './formState.js';

const SECTION_OPTIONS = [
  { value: 'summary', label: 'Highlights' },
  { value: 'thresholds', label: 'Thresholds' },
  { value: 'cards', label: 'Custom cards' }
];

export default function CommandMetricsConfigurator({ open, onClose, onUpdated, initialView, onViewChange }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [settingsForm, setSettingsForm] = useState(buildInitialSettingsForm());
  const [metadata, setMetadata] = useState({ updatedAt: null });
  const [cards, setCards] = useState([]);
  const [cardBusyId, setCardBusyId] = useState(null);
  const [activeAnchor, setActiveAnchor] = useState(initialView ?? 'summary');

  const summarySectionRef = useRef(null);
  const thresholdsSectionRef = useRef(null);
  const cardsSectionRef = useRef(null);

  const sectionRefMap = useMemo(
    () => ({
      summary: summarySectionRef,
      thresholds: thresholdsSectionRef,
      cards: cardsSectionRef
    }),
    []
  );

  const scrollToSection = useCallback(
    (section) => {
      const targetRef = sectionRefMap[section] ?? sectionRefMap.summary;
      if (!targetRef?.current) {
        return;
      }
      const schedule =
        typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame.bind(window)
          : (callback) => setTimeout(callback, 0);
      schedule(() => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [sectionRefMap]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchCommandMetricsConfig({ signal: controller.signal })
      .then(({ settings, cards: fetchedCards }) => {
        setSettingsForm(buildFormState(settings));
        setMetadata(settings?.metadata ?? { updatedAt: null });
        setCards(sortCards((fetchedCards ?? []).map(normaliseCardForState).filter(Boolean)));
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unable to load command metrics');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const nextAnchor = SECTION_OPTIONS.some((option) => option.value === initialView) ? initialView : 'summary';
    setActiveAnchor(nextAnchor);
    scrollToSection(nextAnchor);
  }, [open, initialView, scrollToSection]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!open) {
      setSuccessMessage(null);
    }
  }, [open]);

  const handleAnchorSelect = useCallback(
    (section) => {
      const next = SECTION_OPTIONS.some((option) => option.value === section) ? section : 'summary';
      setActiveAnchor(next);
      if (onViewChange) {
        onViewChange(next);
      }
      scrollToSection(next);
    },
    [onViewChange, scrollToSection]
  );

  const handleNoteChange = useCallback((index, value) => {
    setSettingsForm((current) => {
      const notes = [...current.summary.highlightNotes];
      notes[index] = value;
      return { ...current, summary: { ...current.summary, highlightNotes: notes } };
    });
  }, []);

  const handleAddNote = useCallback(() => {
    setSettingsForm((current) => ({
      ...current,
      summary: { highlightNotes: [...current.summary.highlightNotes, ''] }
    }));
  }, []);

  const handleRemoveNote = useCallback((index) => {
    setSettingsForm((current) => {
      const notes = current.summary.highlightNotes.filter((_, noteIndex) => noteIndex !== index);
      return {
        ...current,
        summary: { highlightNotes: notes.length ? notes : [''] }
      };
    });
  }, []);

  const handleMetricChange = useCallback((metric, field, value) => {
    setSettingsForm((current) => ({
      ...current,
      metrics: {
        ...current.metrics,
        [metric]: {
          ...current.metrics[metric],
          [field]: value
        }
      }
    }));
  }, []);

  const handleSettingsSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setSaving(true);
      setError(null);
      try {
        const payload = buildSettingsPayload(settingsForm);
        const { settings, cards: refreshedCards } = await saveCommandMetricsSettings(payload);
        setSettingsForm(buildFormState(settings));
        setMetadata(settings?.metadata ?? { updatedAt: null });
        setCards(sortCards((refreshedCards ?? []).map(normaliseCardForState).filter(Boolean)));
        setSuccessMessage('Command metrics updated');
        if (onUpdated) {
          onUpdated();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save command metrics');
      } finally {
        setSaving(false);
      }
    },
    [onUpdated, settingsForm]
  );

  const handleAddCard = useCallback(() => {
    setCards((current) => [...current, buildCardDraft(current)]);
  }, []);

  const handleCardSave = useCallback(
    async (card, payload) => {
      setCardBusyId(card.id);
      setError(null);
      try {
        const requestBody = {
          title: payload.title,
          tone: payload.tone,
          details: payload.details,
          displayOrder: Number.isFinite(payload.displayOrder) ? payload.displayOrder : 100,
          isActive: payload.isActive,
          mediaUrl: payload.mediaUrl,
          mediaAlt: payload.mediaAlt,
          cta: payload.cta
        };
        const saved = card.isNew || card.id.startsWith('temp-')
          ? await createCommandMetricCard(requestBody)
          : await updateCommandMetricCardRequest(card.id, requestBody);
        const normalised = normaliseCardForState(saved);
        setCards((current) => sortCards([...current.filter((item) => item.id !== card.id), normalised]));
        setSuccessMessage('Dashboard card saved');
        if (onUpdated) {
          onUpdated();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save dashboard card');
      } finally {
        setCardBusyId(null);
      }
    },
    [onUpdated]
  );

  const handleCardDelete = useCallback(
    async (card) => {
      if (card.isNew || card.id.startsWith('temp-')) {
        setCards((current) => current.filter((item) => item.id !== card.id));
        return;
      }
      setCardBusyId(card.id);
      setError(null);
      try {
        await deleteCommandMetricCardRequest(card.id);
        setCards((current) => current.filter((item) => item.id !== card.id));
        setSuccessMessage('Dashboard card removed');
        if (onUpdated) {
          onUpdated();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete dashboard card');
      } finally {
        setCardBusyId(null);
      }
    },
    [onUpdated]
  );

  const formattedUpdatedAt = useMemo(() => {
    if (!metadata?.updatedAt) {
      return null;
    }
    try {
      return new Date(metadata.updatedAt).toLocaleString();
    } catch {
      return metadata.updatedAt;
    }
  }, [metadata]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-6"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-6"
            >
              <Dialog.Panel className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-primary">
                      Configure command metrics
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600">
                      Adjust operating window highlights, automation thresholds, and add new dashboard callouts for the command centre.
                    </p>
                    {formattedUpdatedAt ? (
                      <p className="mt-1 text-xs text-slate-500">Last saved {formattedUpdatedAt}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {SECTION_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          variant={activeAnchor === option.value ? 'primary' : 'tertiary'}
                          onClick={() => handleAnchorSelect(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={XMarkIcon}
                    aria-label="Close configurator"
                    onClick={onClose}
                  />
                </div>

                {error ? (
                  <div className="mt-4">
                    <StatusPill tone="danger">{error}</StatusPill>
                  </div>
                ) : null}
                {successMessage ? (
                  <div className="mt-4">
                    <StatusPill tone="success">{successMessage}</StatusPill>
                  </div>
                ) : null}

                <div className="mt-6 space-y-8">
                  {loading ? (
                    <div className="flex min-h-[200px] items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      <SummaryHighlightsPanel
                        ref={summarySectionRef}
                        notes={settingsForm.summary.highlightNotes}
                        onAdd={handleAddNote}
                        onChange={handleNoteChange}
                        onRemove={handleRemoveNote}
                        isFocused={activeAnchor === 'summary'}
                      />
                      <MetricThresholdsPanel
                        ref={thresholdsSectionRef}
                        metrics={settingsForm.metrics}
                        onChange={handleMetricChange}
                        isFocused={activeAnchor === 'thresholds'}
                      />
                      <CustomCardsPanel
                        ref={cardsSectionRef}
                        cards={cards}
                        onAdd={handleAddCard}
                        onSave={handleCardSave}
                        onDelete={handleCardDelete}
                        busyId={cardBusyId}
                        tones={TONE_OPTIONS}
                        isFocused={activeAnchor === 'cards'}
                      />
                    </>
                  )}
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <Button variant="secondary" onClick={onClose} size="md">
                    Close
                  </Button>
                  <Button variant="primary" onClick={handleSettingsSubmit} loading={saving} disabled={loading}>
                    Save command metrics
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

CommandMetricsConfigurator.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func,
  initialView: PropTypes.string,
  onViewChange: PropTypes.func
};

CommandMetricsConfigurator.defaultProps = {
  onUpdated: undefined,
  initialView: 'summary',
  onViewChange: undefined
};
