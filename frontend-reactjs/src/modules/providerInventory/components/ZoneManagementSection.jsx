import { ArrowPathIcon, MapIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import { STATUS_OPTIONS } from '../constants.js';
import { useProviderInventory } from '../ProviderInventoryProvider.jsx';

const selectClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function ZoneManagementSection() {
  const {
    data: { zones, zonesLoading, zoneForm, zoneSaving, zoneFeedback, zoneError },
    actions: { loadZones, handleZoneFieldChange, handleZoneEdit, resetZoneForm, handleZoneSubmit, handleZoneDelete }
  } = useProviderInventory();

  return (
    <Card padding="lg" className="space-y-6 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Zone management</h2>
          <p className="text-sm text-slate-600">
            Map storage bays, depots, and staging areas. Zones enable routing decisions and regional asset governance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={resetZoneForm}>
            New zone
          </Button>
          <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadZones()}>
            Refresh zones
          </Button>
        </div>
      </header>

      {zoneFeedback ? <StatusPill tone="success">{zoneFeedback}</StatusPill> : null}
      {zoneError ? <StatusPill tone="danger">{zoneError}</StatusPill> : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Zone</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Code</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zonesLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        <Spinner className="h-4 w-4 text-primary" />
                      </td>
                    </tr>
                  ) : zones.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No zones configured yet.
                      </td>
                    </tr>
                  ) : (
                    zones.map((zone) => (
                      <tr key={zone.id} className="bg-white/70">
                        <td className="px-4 py-3 font-medium text-slate-800">{zone.name}</td>
                        <td className="px-4 py-3 text-slate-600">{zone.code || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={zone.status === 'active' ? 'success' : 'warning'}>{zone.status}</StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="xs" variant="secondary" onClick={() => handleZoneEdit(zone)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              icon={TrashIcon}
                              iconPosition="start"
                              onClick={() => handleZoneDelete(zone.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <header>
            <h3 className="text-lg font-semibold text-primary">{zoneForm.id ? 'Edit zone' : 'Create zone'}</h3>
            <p className="text-xs text-slate-500">
              Align zone codes with warehouse signage or operational area IDs.
            </p>
          </header>
          <TextInput
            label="Zone name"
            value={zoneForm.name}
            onChange={(event) => handleZoneFieldChange('name', event.target.value)}
            required
          />
          <TextInput
            label="Zone code"
            value={zoneForm.code}
            onChange={(event) => handleZoneFieldChange('code', event.target.value)}
          />
          <Textarea
            label="Description"
            minRows={3}
            value={zoneForm.description}
            onChange={(event) => handleZoneFieldChange('description', event.target.value)}
          />
          <FormField id="zone-status" label="Status">
            <select
              id="zone-status"
              className={selectClassName}
              value={zoneForm.status}
              onChange={(event) => handleZoneFieldChange('status', event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={handleZoneSubmit} disabled={zoneSaving}>
              {zoneSaving ? 'Saving…' : 'Save zone'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetZoneForm}>
              Cancel
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={MapIcon} to="/admin/zones">
              Launch zone studio
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
