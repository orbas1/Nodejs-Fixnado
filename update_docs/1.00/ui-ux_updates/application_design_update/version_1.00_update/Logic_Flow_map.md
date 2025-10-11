# Logic Flow Map — Phone Application v1.00

```
AuthBootstrap
  -> validateToken()
  -> fetchProfile()
  -> if profile.role == provider & profile.compliancePending -> ComplianceBanner flagged
  -> routeDecision()

ExploreCoordinator
  -> initZoneContext(lat,lng)
  -> fetchZones()
  -> fetchProviders(filters)
  -> listenToMapGestures()
      -> updateBoundingBox() -> fetchProviders()
  -> onFilterApply(filterSet)
      -> updateFilters(filterSet)
      -> fetchProviders()
  -> onProviderSelect(providerId)
      -> openProviderSheet(providerId)

BookingCoordinator
  -> startBooking(providerId)
      -> loadPackages(providerId)
      -> emit Step1
  -> onPackageConfirm(selection)
      -> preloadAddresses(userId)
      -> emit Step2
  -> onDetailsSubmit(details)
      -> createPaymentIntent()
      -> emit Step3
  -> onPaymentSuccess(paymentIntentId)
      -> createBookingRecord()
      -> sendReceipt()
      -> emit Success
  -> onPaymentFailure(error)
      -> showError(error)
      -> allowRetry()
  -> onChangePaymentMethod()
      -> presentPaymentSheet()
  -> onTimeout()
      -> refreshPaymentIntent()

MarketplaceCoordinator
  -> loadCampaigns(zoneId)
  -> onTabChange(tab)
      -> fetchCategory(tab)
  -> onCampaignActivate(id)
      -> checkSubscriptionStatus()
      -> if eligible -> activateCampaign()
      -> else -> promptUpgrade()

MessagingCoordinator
  -> connectWebSocket(token)
  -> subscribeConversations()
  -> onConversationSelect(id)
      -> loadMessages(id)
  -> onSendMessage(payload)
      -> sendMessage()
      -> awaitAck()
  -> onAttachmentUpload(file)
      -> uploadFile()
      -> appendMessage()
  -> onAckTimeout()
      -> flagMessageFailed()
  -> onReconnect()
      -> resendQueuedMessages()

ProfileCoordinator
  -> loadProfile()
  -> onUpdatePreference(key,value)
      -> patchPreference()
  -> onDocumentUpload(file)
      -> uploadDocument()
      -> refreshCompliance()
  -> onRoleSwitch(role)
      -> clearCaches()
      -> reloadRoleData(role)

NotificationsCoordinator
  -> subscribeSSE(role)
  -> onNotificationTap(notification)
      -> routeDeepLink(notification.target)
  -> onClearAll()
      -> callClearAPI()
  -> onMuteChannel(channelId)
      -> updateNotificationPrefs(channelId,false)

ErrorManager
  -> interceptNetworkErrors()
  -> showOfflineBanner()
  -> queueRetry(task)
  -> reportCriticalError()
      -> sendToSentry()
```

### Integration Notes
- Coordinators implemented as `StateNotifier`s to manage sequential logic and error states.
- All asynchronous steps include cancellation support via `ref.onDispose` to avoid memory leaks.
- Logging handled by `FixnadoLogger` with correlation IDs propagated from backend.
