import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { CloseIcon, ExpandIcon, LocateIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";

/** Same tile source as the admin web map. */
const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

const REGION_DELTA = 0.005;

interface ReportLocationMapProps {
  latitude: number;
  longitude: number;
  label: string;
  detail?: string;
  pinColor?: string;
}

interface MapCanvasProps extends ReportLocationMapProps {
  interactive: boolean;
  showsUserLocation?: boolean;
  mapRef?: RefObject<MapView | null>;
}

function MapCanvas({
  latitude,
  longitude,
  label,
  detail,
  pinColor = Brand.clay,
  interactive,
  showsUserLocation = false,
  mapRef,
}: MapCanvasProps) {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: REGION_DELTA,
        longitudeDelta: REGION_DELTA,
      }}
      mapType={Platform.OS === "android" ? "none" : "standard"}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={interactive}
      pitchEnabled={interactive}
      toolbarEnabled={false}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsCompass={false}
    >
      <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />
      <Marker
        coordinate={{ latitude, longitude }}
        title={label}
        description={detail}
        pinColor={pinColor}
      />
    </MapView>
  );
}

/**
 * Report pin preview with a fullscreen, fully interactive map. The current
 * position is shown as the native blue dot once location access is granted.
 */
export function ReportLocationMap({
  latitude,
  longitude,
  label,
  detail,
  pinColor = Brand.clay,
}: ReportLocationMapProps) {
  const [expanded, setExpanded] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fullMapRef = useRef<MapView | null>(null);

  const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  useEffect(() => {
    if (!expanded) return;
    let active = true;

    void Location.getForegroundPermissionsAsync().then((permission) => {
      if (active && permission.status === "granted") {
        setLocationGranted(true);
      }
    });

    return () => {
      active = false;
    };
  }, [expanded]);

  const locateMe = async () => {
    if (locating) return;
    setLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationError(
          "Location access is off. Enable it to see your position.",
        );
        return;
      }

      setLocationGranted(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      fullMapRef.current?.animateToRegion(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        500,
      );
    } catch {
      setLocationError("Couldn't get your location. Try again.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <View style={styles.wrap}>
        <MapCanvas
          latitude={latitude}
          longitude={longitude}
          label={label}
          detail={detail}
          pinColor={pinColor}
          showsUserLocation={locationGranted}
          interactive={false}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open map fullscreen"
          onPress={() => setExpanded(true)}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="none" style={styles.labelPill}>
          <Text style={styles.labelText}>Report pin</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Expand map"
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [
            styles.expandButton,
            pressed && styles.pressed,
          ]}
        >
          <ExpandIcon size={15} color={Brand.ink} />
        </Pressable>

        <View pointerEvents="none" style={styles.attribution}>
          <Text style={styles.attributionText}>Esri</Text>
        </View>
      </View>

      <Modal
        visible={expanded}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setExpanded(false)}
      >
        <SafeAreaView style={styles.full} edges={["top", "bottom"]}>
          <View style={styles.fullHeader}>
            <View style={styles.fullHeaderText}>
              <Text style={styles.fullEyebrow}>Report location</Text>
              <Text style={styles.fullTitle} numberOfLines={1}>
                {label}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close map"
              onPress={() => setExpanded(false)}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <CloseIcon size={18} color={Brand.ink} />
            </Pressable>
          </View>

          <View style={styles.fullMapWrap}>
            <MapCanvas
              mapRef={fullMapRef}
              latitude={latitude}
              longitude={longitude}
              label={label}
              detail={detail}
              pinColor={pinColor}
              interactive
              showsUserLocation={locationGranted}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show my location"
              onPress={() => void locateMe()}
              disabled={locating}
              style={({ pressed }) => [
                styles.locateButton,
                pressed && styles.pressed,
                locating && styles.disabled,
              ]}
            >
              <LocateIcon size={19} color={Brand.moss} />
            </Pressable>

            <View pointerEvents="none" style={styles.attribution}>
              <Text style={styles.attributionText}>Esri</Text>
            </View>
          </View>

          <View style={styles.fullFooter}>
            <Text style={styles.fullCoords}>{coordinates}</Text>
            {detail ? (
              <Text style={styles.fullDetail} numberOfLines={2}>
                {detail}
              </Text>
            ) : null}
            {locationError ? (
              <Text style={styles.locationError}>{locationError}</Text>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.sand,
  },
  map: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  labelPill: {
    position: "absolute",
    top: 10,
    left: 10,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink70,
  },
  expandButton: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(16,36,26,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  attribution: {
    position: "absolute",
    bottom: 4,
    left: 6,
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
  full: {
    flex: 1,
    backgroundColor: Brand.paper2,
  },
  fullHeader: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fullHeaderText: {
    flex: 1,
    gap: 1,
  },
  fullEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  fullTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: "center",
    justifyContent: "center",
  },
  fullMapWrap: {
    flex: 1,
    overflow: "hidden",
  },
  locateButton: {
    position: "absolute",
    right: 16,
    bottom: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10231A",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fullFooter: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: Brand.paper2,
    gap: 3,
  },
  fullCoords: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    color: Brand.ink55,
  },
  fullDetail: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: Brand.ink70,
  },
  locationError: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: "#B4462F",
  },
});
