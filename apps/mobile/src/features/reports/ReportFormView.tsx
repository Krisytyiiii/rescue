import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter, type Href } from "expo-router";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, {
  Marker,
  UrlTile,
  type MapPressEvent,
  type MarkerDragStartEndEvent,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CheckIcon,
  CloseIcon,
  ExpandIcon,
  MapPinIcon,
  PawIcon,
} from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import type {
  ReportSpecies,
  ReportType,
  UrgencyLevel,
} from "@/domain/report-submission";
import { MAX_REPORT_PHOTOS } from "@/domain/report-submission";

import { useReportViewModel } from "./useReportViewModel";

const REPORT_TYPE_OPTIONS: Array<{ value: ReportType; label: string; hint: string }> = [
  { value: "stray", label: "Stray", hint: "Wandering, no owner in sight" },
  { value: "injured", label: "Injured", hint: "Wounded or in pain" },
  { value: "abandoned", label: "Abandoned", hint: "Left behind by an owner" },
];

const SPECIES_OPTIONS: Array<{ value: ReportSpecies; label: string }> = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "unknown", label: "Not sure" },
];

const URGENCY_OPTIONS: Array<{
  value: UrgencyLevel;
  label: string;
  tone: string;
}> = [
  { value: "low", label: "Low", tone: Brand.ink55 },
  { value: "medium", label: "Medium", tone: Brand.clay },
  { value: "high", label: "High", tone: "#C4791B" },
  { value: "critical", label: "Critical", tone: "#B4462F" },
];

/** Same tile source as the explore map, so Android works without a Maps key. */
const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

const DEFAULT_REGION = {
  latitude: 7.0731,
  longitude: 125.6128,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

interface MapCanvasProps {
  coordinates: { latitude: number; longitude: number } | null;
  style?: StyleProp<ViewStyle>;
  mapRef?: RefObject<MapView | null>;
  onPress: (event: MapPressEvent) => void;
  onDragEnd: (event: MarkerDragStartEndEvent) => void;
}

/** Shared tiled map with the draggable report pin. */
function MapCanvas({
  coordinates,
  style,
  mapRef,
  onPress,
  onDragEnd,
}: MapCanvasProps) {
  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={{
        latitude: coordinates?.latitude ?? DEFAULT_REGION.latitude,
        longitude: coordinates?.longitude ?? DEFAULT_REGION.longitude,
        latitudeDelta: DEFAULT_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_REGION.longitudeDelta,
      }}
      onPress={onPress}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      <UrlTile
        urlTemplate={TILE_URL}
        maximumZ={19}
        flipY={false}
        shouldReplaceMapContent
      />
      {coordinates ? (
        <Marker
          coordinate={coordinates}
          draggable
          onDragEnd={onDragEnd}
          pinColor={Brand.clay}
        />
      ) : null}
    </MapView>
  );
}

export function ReportFormView() {
  const router = useRouter();
  const {
    coordinates,
    setCoordinates,
    locating,
    locationError,
    retryLocation,
    barangays,
    submitting,
    error,
    created,
    photos,
    uploadingPhotos,
    photoError,
    addPhotos,
    removePhoto,
    submit,
    reset,
  } = useReportViewModel();

  const openMyReports = () => router.push("/my-reports" as Href);

  const [reportType, setReportType] = useState<ReportType>("stray");
  const [species, setSpecies] = useState<ReportSpecies>("dog");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [animalCount, setAnimalCount] = useState(1);
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [barangayId, setBarangayId] = useState<number | undefined>();
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const descriptionReady = description.trim().length >= 10;
  const canSubmit =
    Boolean(coordinates) &&
    descriptionReady &&
    !submitting &&
    !uploadingPhotos;
  const remainingPhotos = MAX_REPORT_PHOTOS - photos.length;

  // Recenter once the device fixes its position (or the user retries).
  useEffect(() => {
    if (!coordinates) return;
    mapRef.current?.animateToRegion(
      {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: DEFAULT_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_REGION.longitudeDelta,
      },
      400,
    );
  }, [coordinates]);

  const pinAt = (latitude: number, longitude: number) => {
    setCoordinates({ latitude, longitude });
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    pinAt(latitude, longitude);
  };

  const handleMarkerDrag = (event: MarkerDragStartEndEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    pinAt(latitude, longitude);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setMapExpanded(false);
    await submit({
      reportType,
      species,
      urgencyLevel: urgency,
      animalCount,
      description: description.trim(),
      locationLandmark: landmark.trim() || undefined,
      barangayId,
    });
  };

  const handleAnother = () => {
    setReportType("stray");
    setSpecies("dog");
    setUrgency("medium");
    setAnimalCount(1);
    setDescription("");
    setLandmark("");
    setBarangayId(undefined);
    reset();
  };

  const handlePickPhotos = async () => {
    if (remainingPhotos <= 0 || uploadingPhotos) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingPhotos,
      quality: 0.8,
    });
    if (result.canceled) return;

    await addPhotos(
      result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      })),
    );
  };

  if (created) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.flex} edges={["top"]}>
          <View style={styles.successWrap}>
            <View style={styles.successIcon}>
              <CheckIcon size={26} color={Brand.paper} />
            </View>
            <Text style={styles.successEyebrow}>Report received</Text>
            <Text style={styles.successTitle}>{created.reportCode}</Text>
            <Text style={styles.successBody}>
              The City Vet team will verify it, then dispatch a rescuer. Keep the
              reference code in case you need to follow up.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleAnother}
              style={({ pressed }) => [
                styles.primary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryText}>Report another animal</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={openMyReports}
              style={({ pressed }) => [
                styles.secondary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryText}>View my reports</Text>
              <ArrowUpRightIcon size={15} color={Brand.forest} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>Report</Text>
            <Text style={styles.title}>
              Seen an animal{"\n"}
              <Text style={styles.titleAccent}>in need?</Text>
            </Text>
            <Text style={styles.intro}>
              Send the location and what you saw. A verified report reaches the
              City Vet and the rescue team.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={openMyReports}
              style={({ pressed }) => [
                styles.myReports,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.myReportsText}>View my reports</Text>
              <ArrowUpRightIcon size={14} color={Brand.forest} />
            </Pressable>

            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <MapPinIcon size={18} color={Brand.clay} />
              </View>
              <View style={styles.locationBody}>
                <Text style={styles.locationTitle}>
                  {coordinates ? "Location pinned" : "Finding your location"}
                </Text>
                {coordinates ? (
                  <Text style={styles.locationMeta}>
                    {coordinates.latitude.toFixed(5)},{" "}
                    {coordinates.longitude.toFixed(5)}
                  </Text>
                ) : locating ? (
                  <ActivityIndicator
                    color={Brand.clay}
                    size="small"
                    style={styles.locationSpinner}
                  />
                ) : (
                  <Text style={styles.locationError}>{locationError}</Text>
                )}
              </View>
              {!coordinates && !locating ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void retryLocation()}
                  style={({ pressed }) => [
                    styles.retry,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.mapCard}>
              <MapCanvas
                mapRef={mapRef}
                style={styles.map}
                coordinates={coordinates}
                onPress={handleMapPress}
                onDragEnd={handleMarkerDrag}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open full-screen map"
                onPress={() => setMapExpanded(true)}
                style={({ pressed }) => [
                  styles.mapExpand,
                  pressed && styles.pressed,
                ]}
              >
                <ExpandIcon size={16} color={Brand.moss} />
              </Pressable>
              <Text style={styles.mapHint}>
                Tap the map or drag the pin to adjust the exact spot.
              </Text>
            </View>

            <Modal
              visible={mapExpanded}
              animationType="fade"
              onRequestClose={() => setMapExpanded(false)}
              statusBarTranslucent
            >
              <View style={styles.fullscreenRoot}>
                <MapCanvas
                  key={`${coordinates?.latitude ?? "x"}-${coordinates?.longitude ?? "y"}`}
                  style={styles.fullscreenMap}
                  coordinates={coordinates}
                  onPress={handleMapPress}
                  onDragEnd={handleMarkerDrag}
                />
                <SafeAreaView
                  style={styles.fullscreenOverlay}
                  edges={["top"]}
                  pointerEvents="box-none"
                >
                  <View style={styles.fullscreenHeader} pointerEvents="box-none">
                    <View style={styles.fullscreenTitleWrap}>
                      <Text style={styles.fullscreenTitle}>Pin the location</Text>
                      <Text style={styles.fullscreenMeta}>
                        {coordinates
                          ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
                          : "Waiting for your location"}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close full-screen map"
                      onPress={() => setMapExpanded(false)}
                      style={({ pressed }) => [
                        styles.fullscreenClose,
                        pressed && styles.pressed,
                      ]}
                    >
                      <CloseIcon size={18} color={Brand.ink} />
                    </Pressable>
                  </View>
                </SafeAreaView>
                <SafeAreaView
                  style={styles.fullscreenFooter}
                  edges={["bottom"]}
                  pointerEvents="box-none"
                >
                  <Text style={styles.fullscreenHint}>
                    Tap anywhere or drag the pin, then close to keep it.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setMapExpanded(false)}
                    style={({ pressed }) => [
                      styles.primary,
                      styles.fullscreenDone,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryText}>Use this location</Text>
                  </Pressable>
                </SafeAreaView>
              </View>
            </Modal>

            <Field label="What did you see?">
              <View style={styles.optionGrid}>
                {REPORT_TYPE_OPTIONS.map((option) => {
                  const selected = reportType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setReportType(option.value)}
                      style={({ pressed }) => [
                        styles.optionCard,
                        selected && styles.optionCardActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionTitle,
                          selected && styles.optionTitleActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.optionHint,
                          selected && styles.optionHintActive,
                        ]}
                      >
                        {option.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Species">
              <View style={styles.chipRow}>
                {SPECIES_OPTIONS.map((option) => {
                  const selected = species === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSpecies(option.value)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="How urgent is it?">
              <View style={styles.chipRow}>
                {URGENCY_OPTIONS.map((option) => {
                  const selected = urgency === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setUrgency(option.value)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && {
                          backgroundColor: option.tone,
                          borderColor: option.tone,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="How many animals?">
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fewer animals"
                  onPress={() =>
                    setAnimalCount((count) => Math.max(1, count - 1))
                  }
                  style={({ pressed }) => [
                    styles.stepButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.stepGlyph}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{animalCount}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="More animals"
                  onPress={() =>
                    setAnimalCount((count) => Math.min(50, count + 1))
                  }
                  style={({ pressed }) => [
                    styles.stepButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.stepGlyph}>+</Text>
                </Pressable>
              </View>
            </Field>

            <Field label="Describe the situation">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Injured aspin near the barangay hall, limping and thin."
                placeholderTextColor={Brand.ink55}
                multiline
                maxLength={5000}
                style={styles.textArea}
              />
              <Text style={styles.helper}>
                {description.trim().length}/10 characters minimum
              </Text>
            </Field>

            <Field label="Photos (optional)">
              <Text style={styles.photoHint}>
                Add up to {MAX_REPORT_PHOTOS} photos so responders know what to
                expect.
              </Text>
              <View style={styles.photoGrid}>
                {photos.map((url) => (
                  <View key={url} style={styles.photoTile}>
                    <Image source={{ uri: url }} style={styles.photoImage} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                      onPress={() => removePhoto(url)}
                      style={({ pressed }) => [
                        styles.photoRemove,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.photoRemoveGlyph}>×</Text>
                    </Pressable>
                  </View>
                ))}

                {remainingPhotos > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add photos"
                    accessibilityState={{ disabled: uploadingPhotos }}
                    disabled={uploadingPhotos}
                    onPress={() => void handlePickPhotos()}
                    style={({ pressed }) => [
                      styles.photoAdd,
                      pressed && styles.pressed,
                    ]}
                  >
                    {uploadingPhotos ? (
                      <ActivityIndicator color={Brand.clay} size="small" />
                    ) : (
                      <>
                        <Text style={styles.photoAddGlyph}>+</Text>
                        <Text style={styles.photoAddText}>Add</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.helper}>
                {photos.length} of {MAX_REPORT_PHOTOS} photos
              </Text>
              {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
            </Field>

            <Field label="Nearest landmark (optional)">
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Beside the sari-sari store on Rizal Street"
                placeholderTextColor={Brand.ink55}
                maxLength={255}
                style={styles.input}
              />
            </Field>

            <Field label="Barangay (optional)">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: barangayId === undefined }}
                  onPress={() => setBarangayId(undefined)}
                  style={({ pressed }) => [
                    styles.chip,
                    barangayId === undefined && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      barangayId === undefined && styles.chipTextActive,
                    ]}
                  >
                    Use my account
                  </Text>
                </Pressable>
                {barangays.map((barangay) => {
                  const selected = barangayId === barangay.id;
                  return (
                    <Pressable
                      key={barangay.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setBarangayId(barangay.id)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selected && styles.chipTextActive,
                        ]}
                      >
                        {barangay.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Field>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [
                styles.primary,
                !canSubmit && styles.primaryDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.paper} />
              ) : (
                <>
                  <PawIcon size={18} color={Brand.paper} />
                  <Text style={styles.primaryText}>Send report</Text>
                </>
              )}
            </Pressable>
            <Text style={styles.footnote}>
              Reports are verified by the City Vet before dispatch.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 150,
  },
  eyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  title: {
    marginTop: 10,
    fontFamily: FontFamily.display,
    fontSize: 40,
    lineHeight: 38,
    letterSpacing: -1.2,
    color: Brand.ink,
  },
  titleAccent: {
    fontFamily: FontFamily.displayItalic,
    color: Brand.clay,
  },
  intro: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.ink70,
  },
  locationCard: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
  },
  mapCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 6,
    overflow: "hidden",
  },
  map: {
    height: 190,
    borderRadius: 14,
  },
  mapHint: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    color: Brand.ink55,
  },
  mapExpand: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,248,243,0.94)",
    borderWidth: 1,
    borderColor: Brand.line,
  },
  fullscreenRoot: { flex: 1, backgroundColor: Brand.ink },
  fullscreenMap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fullscreenOverlay: { position: "absolute", top: 0, left: 0, right: 0 },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(250,248,243,0.96)",
  },
  fullscreenTitleWrap: { flex: 1 },
  fullscreenTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  fullscreenMeta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  fullscreenClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  fullscreenFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fullscreenHint: {
    marginBottom: 10,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.paper,
  },
  fullscreenDone: { marginTop: 0, height: 52 },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  locationBody: { flex: 1 },
  locationTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  locationMeta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  locationSpinner: { marginTop: 4, alignSelf: "flex-start" },
  locationError: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#B4462F",
  },
  retry: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  retryText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.forest,
  },
  field: { marginTop: 22 },
  fieldLabel: {
    marginBottom: 9,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  optionGrid: { gap: 8 },
  optionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionCardActive: {
    borderColor: Brand.moss,
    backgroundColor: "rgba(31,122,77,0.08)",
  },
  optionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  optionTitleActive: { color: Brand.forest },
  optionHint: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  optionHintActive: { color: Brand.moss },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: Brand.forest,
    borderColor: Brand.forest,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.ink70,
  },
  chipTextActive: { color: Brand.paper },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  stepGlyph: {
    fontFamily: FontFamily.medium,
    fontSize: 18,
    lineHeight: 20,
    color: Brand.forest,
  },
  stepValue: {
    minWidth: 24,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.ink,
    textAlignVertical: "top",
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Brand.ink,
  },
  helper: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  photoHint: {
    marginBottom: 10,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.ink70,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoTile: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  photoImage: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,24,21,0.72)",
  },
  photoRemoveGlyph: {
    marginTop: -1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 18,
    color: Brand.paper,
  },
  photoAdd: {
    width: 84,
    height: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  photoAddGlyph: {
    fontFamily: FontFamily.medium,
    fontSize: 22,
    lineHeight: 24,
    color: Brand.clay,
  },
  photoAddText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Brand.ink70,
  },
  error: {
    marginTop: 18,
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: "#B4462F",
  },
  primary: {
    marginTop: 24,
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Brand.ink,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.paper,
  },
  secondary: {
    marginTop: 12,
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: Brand.lineStrong,
    backgroundColor: Brand.paper,
  },
  secondaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.forest,
  },
  myReports: {
    alignSelf: "flex-start",
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  myReportsText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.forest,
  },
  pressed: { opacity: 0.7 },
  footnote: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  successWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 100,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.moss,
  },
  successEyebrow: {
    marginTop: 22,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  successTitle: {
    marginTop: 8,
    fontFamily: FontFamily.display,
    fontSize: 36,
    letterSpacing: -1,
    color: Brand.ink,
  },
  successBody: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 14.5,
    lineHeight: 22,
    color: Brand.ink70,
  },
});
