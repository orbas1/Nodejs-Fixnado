import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import FormField from '../../../components/ui/FormField.jsx';
import TextInput from '../../../components/ui/TextInput.jsx';
import StatusPill from '../../../components/ui/StatusPill.jsx';
import {
  BUDGET_TONE_CLASSES
} from '../constants.js';
import { usePurchaseManagement } from '../PurchaseManagementProvider.jsx';

export default function BudgetsSection() {
  const {
    data: {
      budgetFeedback,
      budgetError,
      budgetSaving,
      budgetFilters,
      budgetForm,
      filteredBudgets,
      budgetTotals,
      fiscalYearOptions
    },
    actions: {
      loadBudgets,
      handleBudgetFilterChange,
      handleBudgetEdit,
      handleBudgetReset,
      handleBudgetFieldChange,
      handleBudgetSubmit
    },
    helpers: { formatCurrency }
  } = usePurchaseManagement();

  return (
    <Card padding="lg" className="space-y-8 border-slate-200 bg-white/90 shadow-lg shadow-primary/5">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Budget guardrails</h2>
            <p className="text-sm text-slate-600">
              Track category allocations, commitments, and remaining runway for procurement spend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" icon={PlusIcon} onClick={handleBudgetReset}>
              New budget
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={ArrowPathIcon} onClick={() => loadBudgets()}>
              Refresh budgets
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Allocated</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatCurrency(budgetTotals.allocated, budgetForm.currency || 'GBP')}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-600">Spent</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {formatCurrency(budgetTotals.spent, budgetForm.currency || 'GBP')}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-600">Committed</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">
              {formatCurrency(budgetTotals.committed, budgetForm.currency || 'GBP')}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-600">Remaining</p>
            <p className="mt-1 text-xl font-semibold text-indigo-700">
              {formatCurrency(budgetTotals.remaining, budgetForm.currency || 'GBP')}
            </p>
          </div>
        </div>
        {budgetFeedback ? <StatusPill tone="success">{budgetFeedback}</StatusPill> : null}
        {budgetError ? <StatusPill tone="danger">{budgetError}</StatusPill> : null}
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Budget filters</p>
            <FormField id="fiscal-year" label="Fiscal year">
              <select
                id="fiscal-year"
                value={budgetFilters.fiscalYear}
                onChange={(event) => handleBudgetFilterChange('fiscalYear', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {fiscalYearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All fiscal years' : option}
                  </option>
                ))}
              </select>
            </FormField>
            {budgetFilters.fiscalYear !== 'all' ? (
              <p className="text-xs text-slate-500">
                Showing allocations for FY {budgetFilters.fiscalYear}. Switch to “All fiscal years” for a portfolio view.
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100/80">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Owner</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Allocation</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Utilisation</th>
                    <th className="px-4 py-3 font-semibold text-right text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBudgets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No budget records available yet.
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((budget) => (
                      <tr key={budget.id} className="bg-white/70">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800">{budget.category}</p>
                            <p className="text-xs text-slate-500">FY {budget.fiscalYear}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{budget.owner || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="space-y-1">
                            <p>{formatCurrency(budget.allocated, budget.currency)}</p>
                            <p className="text-xs text-slate-500">
                              Spent {formatCurrency(budget.spent, budget.currency)} • Committed {formatCurrency(budget.committed, budget.currency)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <StatusPill tone={budget.tone}>
                              {budget.remaining > 0
                                ? `${Math.round(Math.min(budget.utilisation * 100, 150))}% used`
                                : 'Fully allocated'}
                            </StatusPill>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div
                                className={`h-2 rounded-full ${BUDGET_TONE_CLASSES[budget.tone]}`}
                                style={{ width: `${Math.min(budget.utilisation * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" size="xs" variant="secondary" onClick={() => handleBudgetEdit(budget)}>
                              Edit
                            </Button>
                            <Button
                              as="a"
                              href={`/dashboards/finance?category=${encodeURIComponent(budget.category ?? '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="xs"
                              variant="ghost"
                            >
                              Open finance view
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
          <header className="space-y-1">
            <h3 className="text-lg font-semibold text-primary">{budgetForm.id ? 'Edit budget' : 'Create budget'}</h3>
            <p className="text-xs text-slate-500">
              Define category guardrails. Updates propagate to all connected procurement workflows.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleBudgetSubmit}>
            <TextInput
              label="Category"
              value={budgetForm.category}
              onChange={(event) => handleBudgetFieldChange('category', event.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Fiscal year"
                type="number"
                value={budgetForm.fiscalYear}
                onChange={(event) => handleBudgetFieldChange('fiscalYear', event.target.value)}
              />
              <TextInput
                label="Currency"
                value={budgetForm.currency}
                onChange={(event) => handleBudgetFieldChange('currency', event.target.value.toUpperCase())}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput
                label="Allocated"
                type="number"
                min="0"
                step="0.01"
                prefix={budgetForm.currency}
                value={budgetForm.allocated}
                onChange={(event) => handleBudgetFieldChange('allocated', event.target.value)}
              />
              <TextInput
                label="Spent"
                type="number"
                min="0"
                step="0.01"
                prefix={budgetForm.currency}
                value={budgetForm.spent}
                onChange={(event) => handleBudgetFieldChange('spent', event.target.value)}
              />
              <TextInput
                label="Committed"
                type="number"
                min="0"
                step="0.01"
                prefix={budgetForm.currency}
                value={budgetForm.committed}
                onChange={(event) => handleBudgetFieldChange('committed', event.target.value)}
              />
            </div>
            <TextInput
              label="Budget owner"
              value={budgetForm.owner}
              onChange={(event) => handleBudgetFieldChange('owner', event.target.value)}
              optionalLabel="optional"
            />
            <FormField id="budget-notes" label="Notes" optionalLabel="optional">
              <textarea
                id="budget-notes"
                value={budgetForm.notes}
                onChange={(event) => handleBudgetFieldChange('notes', event.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Renewal windows, guardrails, alerts…"
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={budgetSaving}>
                {budgetSaving ? 'Saving…' : budgetForm.id ? 'Update budget' : 'Save budget'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleBudgetReset}>
                Clear form
              </Button>
            </div>
          </form>
        </section>
      </div>
    </Card>
  );
}
