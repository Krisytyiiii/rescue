import type { ReportMapMarker } from "@/domain/report-map";

/** Port for the geotagged reports shown on the explore map. */
export interface ReportMapDataSource {
  loadMarkers(): Promise<ReportMapMarker[]>;
}
