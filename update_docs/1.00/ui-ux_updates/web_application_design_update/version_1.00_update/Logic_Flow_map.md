# Logic Flow Map — Web Application v1.00

```
AuthMiddleware
  -> checkJWT()
  -> if missing -> redirect /login
  -> else -> allow route

ExplorerController
  -> parseQueryParams()
  -> fetchZones()
  -> fetchProviders(bounds, filters)
  -> onMapMove() -> updateBounds() -> fetchProviders()
  -> onFilterChange() -> updateURL() -> fetchProviders()
  -> onProviderSelect(id) -> openProviderModal(id)

BookingController
  -> init(providerId)
  -> step1.collectDetails()
  -> step2.schedule()
  -> step3.payment()
  -> confirm() -> createBooking() -> navigate /booking/confirmation/:id

DashboardController(role)
  -> fetchDashboard(role)
  -> subscribeEvents(role)
  -> onQuickAction(action) -> openDrawer(action)

MarketplaceController
  -> fetchCampaigns(page)
  -> onActivate(id) -> activateCampaign(id) -> showToast()
  -> onAnalytics(zone, period) -> fetchAnalytics()

ComplianceController
  -> fetchTasks()
  -> onUpload(doc) -> uploadFile() -> refetchTasks()
  -> onFilter(status) -> updateQuery()

SettingsController
  -> loadTab(tab)
  -> onSave(section, payload) -> mutate() -> showToast()
  -> onDangerAction(action) -> confirmDialog() -> execute()

NotificationsController
  -> connectSSE()
  -> onMessage(payload) -> updateCache()
  -> onMarkRead(id) -> mutate()
```

### Implementation Notes
- Controllers conceptual; implemented via hooks (`useExplorer`, `useDashboard`).
- Maintain optimistic updates with rollback on error.
