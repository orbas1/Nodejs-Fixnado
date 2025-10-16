import { Button } from '../../../components/ui/index.js';
import PageManager from './PageManager.jsx';
import NavigationManager from './NavigationManager.jsx';
import FeedbackToast from './FeedbackToast.jsx';
import { useWebsiteManagement } from '../hooks/useWebsiteManagement.js';
import { NEW_MENU_ID, NEW_PAGE_ID } from '../constants.js';

export default function WebsiteManagementShell() {
  const {
    state: {
      pageSelection,
      selectedPageId,
      pageDraft,
      loadingPages,
      loadingPageDetail,
      savingPage,
      blocks,
      savingBlocks,
      newBlockDraft,
      creatingBlock,
      menuSelection,
      selectedMenuId,
      menuDraft,
      loadingNavigation,
      savingMenu,
      menuItems,
      savingMenuItems,
      newMenuItemDraft,
      creatingMenuItem,
      feedback,
      error
    },
    actions: {
      setPageDraft,
      setBlocks,
      setNewBlockDraft,
      setMenuDraft,
      setMenuItems,
      setNewMenuItemDraft,
      selectPage,
      handlePageTitleChange,
      handlePageSlugChange,
      handlePageSlugBlur,
      regenerateSlug,
      handlePreviewPathChange,
      handlePreviewPathBlur,
      syncPreviewPath,
      savePage,
      deletePage,
      saveBlock,
      addBlock,
      removeBlock,
      selectMenu,
      saveMenu,
      deleteMenu,
      saveMenuItem,
      createMenuItem,
      deleteMenuItem
    }
  } = useWebsiteManagement();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Website management</h1>
            <p className="text-slate-600">
              Configure marketing pages, hero content, and navigation for the Fixnado control centre surfaces.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to="/admin/dashboard" variant="secondary" size="sm">
              Back to admin dashboard
            </Button>
            {pageDraft.previewUrl ? (
              <Button as="a" href={pageDraft.previewUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                View live preview
              </Button>
            ) : null}
          </div>
        </div>
        <FeedbackToast feedback={feedback} error={error} />
      </div>

      <PageManager
        pageSelection={pageSelection}
        selectedPageId={selectedPageId}
        onSelectPage={selectPage}
        onCreatePage={() => selectPage(NEW_PAGE_ID)}
        loadingPages={loadingPages}
        pageDraft={pageDraft}
        handleTitleChange={handlePageTitleChange}
        handleSlugChange={handlePageSlugChange}
        handleSlugBlur={handlePageSlugBlur}
        regenerateSlug={regenerateSlug}
        handlePreviewChange={handlePreviewPathChange}
        handlePreviewBlur={handlePreviewPathBlur}
        syncPreviewPath={syncPreviewPath}
        setPageDraft={setPageDraft}
        loadingPageDetail={loadingPageDetail}
        savePage={savePage}
        savingPage={savingPage}
        deletePage={deletePage}
        blocks={blocks}
        setBlocks={setBlocks}
        saveBlock={saveBlock}
        savingBlocks={savingBlocks}
        removeBlock={removeBlock}
        newBlockDraft={newBlockDraft}
        setNewBlockDraft={setNewBlockDraft}
        addBlock={addBlock}
        creatingBlock={creatingBlock}
      />

      <NavigationManager
        menuSelection={menuSelection}
        selectedMenuId={selectedMenuId}
        onSelectMenu={selectMenu}
        onCreateMenu={() => selectMenu(NEW_MENU_ID)}
        loadingNavigation={loadingNavigation}
        menuDraft={menuDraft}
        setMenuDraft={setMenuDraft}
        saveMenu={saveMenu}
        savingMenu={savingMenu}
        deleteMenu={deleteMenu}
        menuItems={menuItems}
        setMenuItems={setMenuItems}
        saveMenuItem={saveMenuItem}
        savingMenuItems={savingMenuItems}
        deleteMenuItem={deleteMenuItem}
        newMenuItemDraft={newMenuItemDraft}
        setNewMenuItemDraft={setNewMenuItemDraft}
        createMenuItem={createMenuItem}
        creatingMenuItem={creatingMenuItem}
      />
    </div>
  );
}
