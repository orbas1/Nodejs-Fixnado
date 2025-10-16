import PageHeader from '../../components/blueprints/PageHeader.jsx';
import { Card, Spinner, Button } from '../../components/ui/index.js';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useAppearanceManagement, useFeedbackTone } from './useAppearanceManagement.js';
import AppearanceSidebar from './components/AppearanceSidebar.jsx';
import AppearanceProfileEditor from './components/AppearanceProfileEditor.jsx';

export default function AppearanceManagementPage() {
  const management = useAppearanceManagement();
  const feedbackTone = useFeedbackTone(management.feedback, management.statusTones);
  const feedbackMessage = management.feedback?.message ?? null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" data-qa-page="appearance-management">
      <PageHeader
        eyebrow="Admin control tower"
        title="Appearance management"
        description="Configure brand palettes, assets, and marketing variants for Fixnado admin experiences."
        breadcrumbs={[
          { label: 'Operations', to: '/' },
          { label: 'Admin dashboard', to: '/admin/dashboard' },
          { label: 'Appearance management' }
        ]}
        actions={[
          management.previewHref
            ? {
                label: 'Open preview',
                to: management.previewHref,
                variant: 'secondary',
                icon: ArrowTopRightOnSquareIcon,
                analyticsId: 'appearance_preview'
              }
            : null,
          {
            label: 'Theme studio guidelines',
            to: '/docs/theme-governance.pdf',
            variant: 'ghost',
            icon: Squares2X2Icon,
            analyticsId: 'appearance_guidelines'
          }
        ].filter(Boolean)}
        meta={management.headerMeta}
      />

      <div className="mx-auto max-w-7xl px-6 pt-16">
        {management.loading ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : management.error ? (
          <Card padding="lg" className="border-rose-200 bg-white/90 text-rose-600">
            <h2 className="text-lg font-semibold">Unable to load appearance management</h2>
            <p className="mt-2 text-sm">{management.error.message}</p>
            <Button className="mt-4" icon={ArrowPathIcon} variant="secondary" onClick={management.reload}>
              Retry
            </Button>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,1fr)]">
            <AppearanceSidebar
              profiles={management.profiles}
              selectedProfileId={management.selectedProfileId}
              onSelectProfile={management.handleSelectProfile}
              onCreateProfile={() => management.handleSelectProfile('new')}
              feedbackTone={feedbackTone}
              feedbackMessage={feedbackMessage}
              roleChoices={management.roleChoices}
              allowedRoles={management.form.allowedRoles}
              onToggleRole={management.handleRoleToggle}
              onSave={management.handleSave}
              onReset={management.handleReset}
              onArchive={management.handleArchive}
              saving={management.saving}
            />

            <AppearanceProfileEditor
              form={management.form}
              onFieldChange={management.handleFieldChange}
              onGovernanceChange={management.handleGovernanceChange}
              onColorChange={management.handleColorChange}
              onTypographyChange={management.handleTypographyChange}
              onLayoutChange={management.handleLayoutChange}
              onImageryChange={management.handleImageryChange}
              onWidgetChange={management.handleWidgetChange}
              onAddAsset={management.handleAddAsset}
              onAssetChange={management.handleAssetChange}
              onAssetMetadataChange={management.handleAssetMetadataChange}
              onMoveAsset={management.handleMoveAsset}
              onRemoveAsset={management.handleRemoveAsset}
              onAddVariant={management.handleAddVariant}
              onVariantChange={management.handleVariantChange}
              onVariantCopyChange={management.handleVariantCopyChange}
              onMoveVariant={management.handleMoveVariant}
              onRemoveVariant={management.handleRemoveVariant}
              onPreviewVariant={management.handlePreviewVariant}
              previewHref={management.previewHref}
            />
          </div>
        )}
      </div>
    </div>
  );
}
