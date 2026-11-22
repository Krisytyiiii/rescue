import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle, Marker, UrlTile } from "react-native-maps";
import type { Region } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CloseIcon,
  ExpandIcon,
  LocateIcon,
} from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import {
  REPORT_STATUS_META,
  REPORT_STATUS_ORDER,
  type ReportMapMarker,
  type ReportStatusCounts,
  type ReportStatusFilter,
} from "@/domain/report-map";
import { useExploreMapViewModel } from "@/features/explore/useExploreMapViewModel";
import {
  REPORT_TYPE_LABEL,
  SPECIES_LABEL,
  STATUS_LABEL,
  URGENCY_LABEL,
} from "@/features/rescuer/presentation";
import { RescuerScreenHeader } from "@/features/rescuer/RescuerScreenHeader";

/** Same tile source as the admin web rescues map. */
const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

const INITIAL_REGION = {
  latitude: 7.0731,
  longitude: 125.6128,
  latitudeDelta: 0.075,
  longitudeDelta: 0.075,
};

const FIT_PADDING = { top: 90, right: 56, bottom: 210, left: 56 };

type MapMode = "pins" | "heatmap";

/** Heat density rings are sized from the visible latitude span. */
function heatRadii(region: Region): [number, number, number] {
  const base = Math.max(140, region.latitudeDelta * 111_320 * 0.045);
  return [base * 1.7, base, base * 0.55];
}

export default function ExploreMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    counts,
    visible,
    filter,
    setFilter,
    selected,
    selectedId,
    select,
    loading,
    error,
  } = useExploreMapViewModel();

  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<MapMode>("pins");
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fitToMarkers = useCallback(
    (markers: ReportMapMarker[], animated: boolean) => {
      if (markers.length === 0) return;
      mapRef.current?.fitToCoordinates(
        markers.map((marker) => ({
          latitude: marker.latitude,
          longitude: marker.longitude,
        })),
        { edgePadding: FIT_PADDING, animated },
      );
    },
    [],
  );

  useEffect(() => {
    if (!mapReady || visible.length === 0) return;
    fitToMarkers(visible, false);
  }, [mapReady, filter, visible, fitToMarkers]);

  const locateMe = async () => {
    if (locating) return;
    setLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationError("Location access is off.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      mapRef.current?.animateToRegion(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        450,
      );
    } catch {
      setLocationError("Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  };

  const activeFilterLabel =
    filter === "all" ? "All" : REPORT_STATUS_META[filter].label;
  const [heatOuter, heatMid, heatInner] = heatRadii(region);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <RescuerScreenHeader
          title="Explore map"
          subtitle={`${visible.length} reports · ${activeFilterLabel} · ${
            mode === "heatmap" ? "Heatmap" : "Dots"
          }`}
          onBack={() => router.back()}
        />

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={INITIAL_REGION}
            mapType={Platform.OS === "android" ? "none" : "standard"}
            toolbarEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            showsPointsOfInterests={false}
            showsBuildings={false}
            mapPadding={{
              top: 70,
              right: 12,
              bottom: selected ? 270 : 170,
              left: 12,
            }}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={setRegion}
          >
            <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />

            {mode === "heatmap"
              ? visible.map((marker) => {
                  const meta = REPORT_STATUS_META[marker.reportStatus];
                  const center = {
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  };

                  return (
                    <Fragment key={marker.id}>
                      <Circle
                        center={center}
                        radius={heatOuter}
                        fillColor={`${meta.pin}1A`}
                        strokeColor="transparent"
                        strokeWidth={0}
                      />
                      <Circle
                        center={center}
                        radius={heatMid}
                        fillColor={`${meta.pin}38`}
                        strokeColor="transparent"
                        strokeWidth={0}
                      />
                      <Circle
                        center={center}
                        radius={heatInner}
                        fillColor={`${meta.pin}7A`}
                        strokeColor="transparent"
                        strokeWidth={0}
                      />
                    </Fragment>
                  );
                })
              : visible.map((marker) => {
                  const meta = REPORT_STATUS_META[marker.reportStatus];
                  const active = marker.id === selectedId;

                  return (
                    <Marker
                      key={marker.id}
                      coordinate={{
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                      }}
                      onPress={() => select(marker.id)}
                      zIndex={active ? 1000 : 0}
                      anchor={{ x: 0.5, y: 0.5 }}
                      accessibilityLabel={`${marker.reportCode}, ${meta.label}`}
                    >
                      <View style={styles.pinTouch}>
                        <View
                          style={[
                            styles.pin,
                            {
                              backgroundColor: meta.pin,
                              borderColor: Brand.paper,
                            },
                            active && styles.pinActive,
                          ]}
                        />
                      </View>
                    </Marker>
                  );
                })}
          </MapView>

          <View style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <StatusChip
                label="All"
                pin={Brand.ink70}
                count={counts.total}
                active={filter === "all"}
                onPress={() => setFilter("all")}
              />
              {REPORT_STATUS_ORDER.map((status) => {
                const meta = REPORT_STATUS_META[status];
                return (
                  <StatusChip
                    key={status}
                    label={meta.label}
                    pin={meta.pin}
                    count={counts[status]}
                    active={filter === status}
                    onPress={() => setFilter(status as ReportStatusFilter)}
                  />
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.modeToggle}>
            <ModeOption
              label="Dots"
              active={mode === "pins"}
              onPress={() => setMode("pins")}
            />
            <ModeOption
              label="Heatmap"
              active={mode === "heatmap"}
              onPress={() => setMode("heatmap")}
            />
          </View>

          <View style={styles.mapActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fit all reports"
              onPress={() => fitToMarkers(visible, true)}
              style={({ pressed }) => [
                styles.mapButton,
                pressed && styles.pressed,
              ]}
            >
              <ExpandIcon size={17} color={Brand.moss} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show my location"
              onPress={() => void locateMe()}
              disabled={locating}
              style={({ pressed }) => [
                styles.mapButton,
                pressed && styles.pressed,
                locating && styles.disabled,
              ]}
            >
              {locating ? (
                <ActivityIndicator size="small" color={Brand.moss} />
              ) : (
                <LocateIcon size={18} color={Brand.moss} />
              )}
            </Pressable>
          </View>

          {locationError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{locationError}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.centerOverlay} pointerEvents="none">
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={Brand.moss} />
                <Text style={styles.loadingText}>Loading report map</Text>
              </View>
            </View>
          ) : null}

          {!loading && visible.length === 0 ? (
            <View style={styles.centerOverlay} pointerEvents="none">
              <View style={styles.emptyPill}>
                <Text style={styles.emptyText}>No reports match this view</Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={styles.notice} pointerEvents="none">
              <Text style={styles.noticeText}>{error}</Text>
            </View>
          ) : null}

          {selected ? (
            <ReportCard
              report={selected}
              bottom={Math.max(insets.bottom, 12)}
              onClose={() => select(selected.id)}
            />
          ) : (
            <StatusLegend
              counts={counts}
              bottom={Math.max(insets.bottom, 12)}
            />
          )}

          <View pointerEvents="none" style={styles.attribution}>
            <Text style={styles.attributionText}>Esri</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ModeOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} map`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeOption,
        active && styles.modeOptionActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatusChip({
  label,
  pin,
  count,
  active,
  onPress,
}: {
  label: string;
  pin: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} reports`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.chipDot, { backgroundColor: pin }]} />
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
      <Text style={[styles.chipCount, active && styles.chipCountActive]}>
        {count}
      </Text>
    </Pressable>
  );
}

function StatusLegend({
  counts,
  bottom,
}: {
  counts: ReportStatusCounts;
  bottom: number;
}) {
  return (
    <View style={[styles.legend, { bottom }]}>
      <View style={styles.legendHead}>
        <Text style={styles.legendTitle}>Report status</Text>
        <Text style={styles.legendTotal}>{counts.total} mapped</Text>
      </View>

      <View style={styles.legendGrid}>
        {REPORT_STATUS_ORDER.map((status) => {
          const meta = REPORT_STATUS_META[status];
          return (
            <View key={status} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: meta.pin }]}
              />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {meta.label}
              </Text>
              <Text style={styles.legendCount}>{counts[status]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ReportCard({
  report,
  bottom,
  onClose,
}: {
  report: ReportMapMarker;
  bottom: number;
  onClose: () => void;
}) {
  const meta = REPORT_STATUS_META[report.reportStatus];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;

  return (
    <View style={[styles.card, { bottom }]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardDot, { backgroundColor: meta.pin }]} />
        <Text style={styles.cardCode}>{report.reportCode}</Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: `${meta.pin}1F`, borderColor: `${meta.pin}55` },
          ]}
        >
          <Text style={[styles.statusPillText, { color: meta.pin }]}>
            {meta.label}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close report details"
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [styles.cardClose, pressed && styles.pressed]}
        >
          <CloseIcon size={15} color={Brand.ink55} />
        </Pressable>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {report.description}
      </Text>

      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText}>
          {URGENCY_LABEL[report.urgency]} urgency ·{" "}
          {SPECIES_LABEL[report.species]} ·{" "}
          {REPORT_TYPE_LABEL[report.reportType]}
        </Text>
        <Text style={styles.cardMetaText} numberOfLines={1}>
          {report.barangay ?? "Unmapped"}
          {report.landmark ? ` · ${report.landmark}` : ""}
        </Text>
      </View>

      <View style={styles.cardFacts}>
        <Fact label="Reporter" value={report.reporter} />
        <Fact
          label="Rescuer"
          value={report.rescuerName ?? "Unassigned"}
          align="right"
        />
        <Fact
          label="Rescue"
          value={
            report.assignmentStatus
              ? STATUS_LABEL[report.assignmentStatus]
              : "Not dispatched"
          }
        />
        <Fact
          label="Submitted"
          value={formatClock(report.submittedAt)}
          align="right"
        />
      </View>

      <View style={styles.cardFoot}>
        <Text style={styles.cardCoords}>
          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open this report in Google Maps"
          onPress={() => void Linking.openURL(mapsUrl)}
          style={({ pressed }) => [styles.mapsLink, pressed && styles.pressed]}
        >
          <Text style={styles.mapsLinkText}>Open in Maps</Text>
          <ArrowUpRightIcon size={12} color={Brand.clay} />
        </Pressable>
      </View>
    </View>
  );
}

function Fact({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <View style={[styles.fact, align === "right" && styles.factRight]}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function formatClock(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const label = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutes} ${label}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper2,
  },
  flex: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#eef6ef",
  },
  filterBar: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
  },
  filterRow: {
    paddingHorizontal: 14,
    gap: 7,
  },
  chip: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.88)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#10231A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chipActive: {
    backgroundColor: Brand.forest,
    borderColor: Brand.forest,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink70,
  },
  chipLabelActive: {
    color: Brand.paper,
  },
  chipCount: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Brand.ink55,
  },
  chipCountActive: {
    color: "rgba(255,255,255,0.6)",
  },
  modeToggle: {
    position: "absolute",
    left: 14,
    top: 52,
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 3,
    gap: 2,
    shadowColor: "#10231A",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  modeOption: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  modeOptionActive: {
    backgroundColor: Brand.forest,
  },
  modeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink70,
  },
  modeLabelActive: {
    color: Brand.paper,
  },
  mapActions: {
    position: "absolute",
    right: 14,
    top: 56,
    gap: 8,
  },  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10231A",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  pinTouch: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.5,
    shadowColor: "#062014",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
  notice: {
    position: "absolute",
    top: 96,
    left: 14,
    right: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180,70,47,0.2)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  noticeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: "#B4462F",
  },
  centerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  emptyPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  legend: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 13,
    shadowColor: "#10231A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  legendHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  legendTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  legendTotal: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Brand.ink55,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 7,
    columnGap: 10,
  },
  legendItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 10,
    color: Brand.ink70,
  },
  legendCount: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Brand.ink55,
  },
  card: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "rgba(255,255,255,0.97)",
    padding: 14,
    shadowColor: "#10231A",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardCode: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: Brand.ink55,
  },
  statusPill: {
    height: 21,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  cardClose: {
    marginLeft: "auto",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,36,26,0.05)",
  },
  cardTitle: {
    marginTop: 9,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: Brand.ink,
  },
  cardMeta: {
    marginTop: 6,
    gap: 2,
  },
  cardMetaText: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: Brand.ink55,
  },
  cardFacts: {
    marginTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
    borderRadius: 12,
    backgroundColor: "rgba(16,36,26,0.035)",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  fact: {
    width: "50%",
  },
  factRight: {
    alignItems: "flex-end",
  },
  factLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  factValue: {
    marginTop: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink,
  },
  cardFoot: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardCoords: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.3,
    color: Brand.ink55,
  },
  mapsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mapsLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.clay,
  },
  attribution: {
    position: "absolute",
    top: 58,
    right: 62,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  attributionText: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    color: Brand.ink55,
  },
});
