import PropTypes from 'prop-types';
import { Button, Card, Checkbox, FormField, TextInput } from '../../../components/ui/index.js';
import { NEW_MENU_ID } from '../constants.js';
import SelectionPanel from './SelectionPanel.jsx';

function MenuItemEditor({ item, menuItems, onChange, onToggle, onSave, onDelete, saving }) {
  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    if (field === 'parentId') {
      onChange(item.id, field, value || '');
      return;
    }
    onChange(item.id, field, value);
  };

  return (
    <Card className="flex flex-col gap-4 border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
          <p className="text-xs text-slate-500">{item.url}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onSave(item.id)} disabled={saving}>
            Save item
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(item.id)} disabled={saving}>
            Delete
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Label" value={item.label} onChange={handleFieldChange('label')} />
        <TextInput label="URL" value={item.url} onChange={handleFieldChange('url')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Icon" value={item.icon} onChange={handleFieldChange('icon')} />
        <TextInput label="Sort order" type="number" value={item.sortOrder} onChange={handleFieldChange('sortOrder')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Visibility" value={item.visibility} onChange={handleFieldChange('visibility')} />
        <FormField id={`item-parent-${item.id}`} label="Parent item">
          <select
            id={`item-parent-${item.id}`}
            className="fx-text-input"
            value={item.parentId || ''}
            onChange={handleFieldChange('parentId')}
          >
            <option value="">No parent</option>
            {menuItems
              .filter((candidate) => candidate.id !== item.id)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
          </select>
        </FormField>
      </div>
      <Checkbox
        label="Open in new tab"
        checked={item.openInNewTab}
        onChange={(event) => onToggle(item.id, event.target.checked)}
      />
      <TextInput label="Allowed roles" value={item.allowedRoles} onChange={handleFieldChange('allowedRoles')} />
      <FormField id={`item-settings-${item.id}`} label="Settings JSON">
        <textarea
          id={`item-settings-${item.id}`}
          className="fx-text-input min-h-[120px] font-mono text-xs"
          value={item.settings}
          onChange={handleFieldChange('settings')}
        />
      </FormField>
      <TextInput label="Analytics tag" value={item.analyticsTag} onChange={handleFieldChange('analyticsTag')} />
    </Card>
  );
}

MenuItemEditor.propTypes = {
  item: PropTypes.object.isRequired,
  menuItems: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

export default function NavigationManager({
  menuSelection,
  selectedMenuId,
  onSelectMenu,
  onCreateMenu,
  loadingNavigation,
  menuDraft,
  setMenuDraft,
  saveMenu,
  savingMenu,
  deleteMenu,
  menuItems,
  setMenuItems,
  saveMenuItem,
  savingMenuItems,
  deleteMenuItem,
  newMenuItemDraft,
  setNewMenuItemDraft,
  createMenuItem,
  creatingMenuItem
}) {
  const menuItemsSelection = menuSelection.map((menu) => ({
    id: menu.id,
    label: menu.name,
    helper: `${menu.location}${menu.isPrimary ? ' • Primary' : ''}`
  }));

  const menuFieldChange = (field) => (event) => setMenuDraft((current) => ({ ...current, [field]: event.target.value }));

  const menuItemFieldChange = (itemId, field, value) => {
    setMenuItems((current) => current.map((entry) => (entry.id === itemId ? { ...entry, [field]: value } : entry)));
  };

  const menuItemToggle = (itemId, next) => {
    setMenuItems((current) => current.map((entry) => (entry.id === itemId ? { ...entry, openInNewTab: next } : entry)));
  };

  const newItemFieldChange = (field) => (event) => setNewMenuItemDraft((current) => ({ ...current, [field]: event.target.value }));

  return (
    <section className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <SelectionPanel
          title="Navigation menus"
          actionLabel="New menu"
          onAction={onCreateMenu}
          items={menuItemsSelection}
          selectedId={selectedMenuId}
          onSelect={onSelectMenu}
          loading={loadingNavigation}
          emptyMessage="No navigation menus configured yet."
        />
        <Card className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">
              {selectedMenuId === NEW_MENU_ID ? 'New navigation menu' : 'Menu settings'}
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={saveMenu} disabled={savingMenu}>
                Save menu
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={deleteMenu}
                disabled={savingMenu || !selectedMenuId || selectedMenuId === NEW_MENU_ID}
              >
                Delete
              </Button>
            </div>
          </div>
          <TextInput label="Menu name" value={menuDraft.name} onChange={menuFieldChange('name')} />
          <TextInput
            label="Location"
            value={menuDraft.location}
            onChange={menuFieldChange('location')}
            hint="For example: header, footer, legal"
          />
          <TextInput label="Description" value={menuDraft.description} onChange={menuFieldChange('description')} />
          <Checkbox
            label="Primary menu"
            checked={menuDraft.isPrimary}
            onChange={(event) => setMenuDraft((current) => ({ ...current, isPrimary: event.target.checked }))}
          />
          <TextInput label="Allowed roles" value={menuDraft.allowedRoles} onChange={menuFieldChange('allowedRoles')} />
          <FormField id="menu-metadata" label="Metadata JSON">
            <textarea
              id="menu-metadata"
              className="fx-text-input min-h-[120px] font-mono text-xs"
              value={menuDraft.metadata}
              onChange={menuFieldChange('metadata')}
            />
          </FormField>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Menu items</h3>
            {selectedMenuId === NEW_MENU_ID ? (
              <p className="text-sm text-slate-500">Save the menu to begin adding items.</p>
            ) : menuItems.length === 0 ? (
              <p className="text-sm text-slate-500">No items yet. Add your first item below.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {menuItems.map((item) => (
                  <MenuItemEditor
                    key={item.id}
                    item={item}
                    menuItems={menuItems}
                    onChange={menuItemFieldChange}
                    onToggle={menuItemToggle}
                    onSave={saveMenuItem}
                    onDelete={deleteMenuItem}
                    saving={Boolean(savingMenuItems?.[item.id])}
                  />
                ))}
              </div>
            )}
          </div>

          <Card className="flex flex-col gap-4 border border-dashed border-slate-300 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Add navigation item</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Label" value={newMenuItemDraft.label} onChange={newItemFieldChange('label')} />
              <TextInput label="URL" value={newMenuItemDraft.url} onChange={newItemFieldChange('url')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Icon" value={newMenuItemDraft.icon} onChange={newItemFieldChange('icon')} />
              <TextInput label="Sort order" type="number" value={newMenuItemDraft.sortOrder} onChange={newItemFieldChange('sortOrder')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Visibility" value={newMenuItemDraft.visibility} onChange={newItemFieldChange('visibility')} />
              <FormField id="new-item-parent" label="Parent item">
                <select
                  id="new-item-parent"
                  className="fx-text-input"
                  value={newMenuItemDraft.parentId}
                  onChange={newItemFieldChange('parentId')}
                >
                  <option value="">No parent</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <Checkbox
              label="Open in new tab"
              checked={newMenuItemDraft.openInNewTab}
              onChange={(event) => setNewMenuItemDraft((current) => ({ ...current, openInNewTab: event.target.checked }))}
            />
            <TextInput label="Allowed roles" value={newMenuItemDraft.allowedRoles} onChange={newItemFieldChange('allowedRoles')} />
            <FormField id="new-item-settings" label="Settings JSON">
              <textarea
                id="new-item-settings"
                className="fx-text-input min-h-[120px] font-mono text-xs"
                value={newMenuItemDraft.settings}
                onChange={newItemFieldChange('settings')}
              />
            </FormField>
            <TextInput label="Analytics tag" value={newMenuItemDraft.analyticsTag} onChange={newItemFieldChange('analyticsTag')} />
            <Button size="sm" variant="primary" onClick={createMenuItem} disabled={creatingMenuItem || selectedMenuId === NEW_MENU_ID}>
              Add item
            </Button>
          </Card>
        </Card>
      </div>
    </section>
  );
}

NavigationManager.propTypes = {
  menuSelection: PropTypes.array.isRequired,
  selectedMenuId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectMenu: PropTypes.func.isRequired,
  onCreateMenu: PropTypes.func.isRequired,
  loadingNavigation: PropTypes.bool,
  menuDraft: PropTypes.object.isRequired,
  setMenuDraft: PropTypes.func.isRequired,
  saveMenu: PropTypes.func.isRequired,
  savingMenu: PropTypes.bool,
  deleteMenu: PropTypes.func.isRequired,
  menuItems: PropTypes.array.isRequired,
  setMenuItems: PropTypes.func.isRequired,
  saveMenuItem: PropTypes.func.isRequired,
  savingMenuItems: PropTypes.object.isRequired,
  deleteMenuItem: PropTypes.func.isRequired,
  newMenuItemDraft: PropTypes.object.isRequired,
  setNewMenuItemDraft: PropTypes.func.isRequired,
  createMenuItem: PropTypes.func.isRequired,
  creatingMenuItem: PropTypes.bool
};
