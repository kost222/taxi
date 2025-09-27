# Map Implementation Notes

## Leaflet Fixes and Features

### 1. Marker Drift Fix (Task 7)
**Problem:** Marker "drifts" or "runs away" when map is moved or zoomed.

**Solution:**
- Subscribe to `moveend` and `zoomend` events
- Force sync marker position with stored coordinates
- Implementation in `Map.tsx`:
```javascript
mapRef.current.on('moveend zoomend', () => {
  if (userMarkerRef.current) {
    userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
  }
});
```

### 2. Compact Hint (Task 8)
**Problem:** Hint takes too much space on mobile.

**Solution:**
- Single line display for destination
- Text truncation with ellipsis
- Full coordinates in title attribute for hover
- Hide "From" field when coordinates are available

### 3. Remove Logo/Controls (Tasks 9, 9b)
**Mobile specific:**
- Disable zoom control on screens < 768px
- CSS to hide attribution visually
- Keep attribution text in screen-reader-only element (accessibility)

**Implementation:**
```javascript
const isMobile = window.innerWidth < 768;
mapRef.current = L.map(mapContainerRef.current, {
  zoomControl: !isMobile
});
```

```css
.leaflet-control-attribution {
  display: none !important;
}
```

### 4. Fullscreen Button (Task 24)
**Position:** Bottom right corner
**Features:**
- Uses native fullscreen API
- Fallback for webkit/ms prefixes
- Toggle state indication

### 5. Vehicle Display (Task 22)
**Features:**
- Show nearby vehicles as blue markers
- Highlight assigned vehicle in orange
- Auto-refresh every 10 seconds
- Custom icons with emoji

## Mobile Optimizations

1. **Touch Gestures:** Enabled by default in Leaflet
2. **No Zoom Controls:** Removed on mobile to save space
3. **Fullscreen Mode:** Custom button for better UX
4. **Responsive Hints:** Compact display with truncation

## Performance Considerations

1. **Marker Updates:** Batch updates when possible
2. **API Calls:** Debounce vehicle fetching (10s interval)
3. **Re-renders:** Use refs for map instances to avoid recreating

## Accessibility

1. **Attribution:** Hidden visually but available for screen readers
2. **Keyboard Navigation:** Leaflet handles this natively
3. **ARIA Labels:** Added where appropriate

## Known Issues

1. **iOS Safari:** Fullscreen API not fully supported - falls back to maximize
2. **Old Android:** Some gesture conflicts with native scroll - use touch-action CSS

## Future Improvements

1. Clustering for many vehicles
2. Route polylines between from/to
3. Traffic layer integration
4. Custom tile servers for better performance