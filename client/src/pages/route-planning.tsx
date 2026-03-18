import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Clock, ExternalLink, Home } from "lucide-react";
import { getStatusLabel, getStatusColor, formatDate } from "@/lib/formatters";
import type { Job } from "@shared/schema";


interface RouteStop extends Job {
  stopNumber: number;
  estimatedArrival: string;
  estimatedDuration: number;
  driveMinutes: number;
  latitude: number | null;
  longitude: number | null;
  customerName: string;
  address: string;
}

interface RouteData {
  date: string;
  homeBase: { lat: number; lng: number; label: string };
  stops: RouteStop[];
  totalJobs: number;
  totalKm: number;
  totalMinutes: number;
}

export default function RoutePlanningPage() {
  const [, navigate] = useHashLocation();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const { data: routeData } = useQuery<RouteData>({
    queryKey: [`/api/route/daily?date=${selectedDate}`],
  });

  // Load Leaflet from CDN
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Leaflet map when routeData arrives (the map div is conditionally rendered)
  useEffect(() => {
    if (!routeData || routeData.stops.length === 0) return;
    if (!mapRef.current) return;

    const tryInit = () => {
      const Lf = (window as any).L;
      if (!Lf) {
        setTimeout(tryInit, 200);
        return;
      }

      // Fix default icon paths
      delete (Lf.Icon.Default.prototype as any)._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = Lf.map(mapRef.current!).setView([56.1246, 10.1916], 7);
      mapInstanceRef.current = map;

      Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      setTimeout(() => {
        map.invalidateSize();
        updateMapMarkers(Lf, map, routeData);
      }, 300);
    };

    // Small delay to ensure DOM is painted
    setTimeout(tryInit, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeData]);

  function updateMapMarkers(Lf: any, map: any, data: RouteData) {
    // Clear existing marker/polyline layers
    map.eachLayer((layer: any) => {
      if (!(layer as any)._url) {
        // Keep tile layers, remove everything else
        map.removeLayer(layer);
      }
    });

    const bounds: [number, number][] = [];
    const routePoints: [number, number][] = [];

    // Home base marker
    const homeIcon = Lf.divIcon({
      className: "custom-div-icon",
      html: `<div style="background:#2d6a2d;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);">H</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const homeLatLng: [number, number] = [data.homeBase.lat, data.homeBase.lng];
    Lf.marker(homeLatLng, { icon: homeIcon })
      .addTo(map)
      .bindPopup(`<b>${data.homeBase.label}</b><br/>Hjemmebase`);
    bounds.push(homeLatLng);
    routePoints.push(homeLatLng);

    // Job stop markers
    for (const stop of data.stops) {
      if (stop.latitude && stop.longitude) {
        const latLng: [number, number] = [stop.latitude, stop.longitude];
        const icon = Lf.divIcon({
          className: "custom-div-icon",
          html: `<div style="background:#1a5c1a;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);">${stop.stopNumber}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        Lf.marker(latLng, { icon })
          .addTo(map)
          .bindPopup(`<b>${stop.stopNumber}. ${stop.title}</b><br/>${stop.customerName}<br/>ca. ${stop.estimatedArrival} · ~${stop.estimatedDuration} min`);
        bounds.push(latLng);
        routePoints.push(latLng);
      }
    }

    // Return to home
    routePoints.push(homeLatLng);

    // Route polyline
    if (routePoints.length > 1) {
      Lf.polyline(routePoints, { color: "#2d6a2d", weight: 3, opacity: 0.7, dashArray: "8, 8" }).addTo(map);
    }

    // Fit bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  const formatMinutes = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}t ${m}min` : `${m}min`;
  };

  const getGoogleMapsUrl = () => {
    if (!routeData || routeData.stops.length === 0) return "#";
    const home = `${routeData.homeBase.lat},${routeData.homeBase.lng}`;
    const waypoints = routeData.stops
      .filter(s => s.latitude && s.longitude)
      .map(s => `${s.latitude},${s.longitude}`)
      .join("/");
    return `https://www.google.com/maps/dir/${home}/${waypoints}/${home}`;
  };

  return (
    <div className="space-y-6" data-testid="route-planning-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Køreplan — {formatDate(selectedDate)}</h1>
          <p className="text-muted-foreground">Daglig køreplan med optimeret rute</p>
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
          data-testid="route-date-picker"
        />
      </div>

      {!routeData || routeData.stops.length === 0 ? (
        <Card data-testid="route-empty">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Ingen jobs planlagt for denne dag</p>
            <p className="text-muted-foreground text-sm mt-1">Vælg en anden dato eller opret nye jobs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left panel: Job sequence */}
          <div className="lg:col-span-2 space-y-4">
            <Card data-testid="route-job-list">
              <CardHeader>
                <CardTitle className="text-lg">Rute ({routeData.totalJobs} stops)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Start */}
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    <Home className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Hjemmebase — Højbjerg</p>
                    <p className="text-xs text-muted-foreground">Start ca. 08:00</p>
                  </div>
                </div>

                {/* Stops */}
                {routeData.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/jobs/${stop.id}`)}
                    data-testid={`route-stop-${stop.stopNumber}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {stop.stopNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{stop.title}</p>
                      <p className="text-xs text-muted-foreground">{stop.customerName}</p>
                      <p className="text-xs text-muted-foreground">{stop.address}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />ca. {stop.estimatedArrival}
                        </span>
                        <span className="text-xs text-muted-foreground">~{stop.estimatedDuration} min</span>
                        <Badge className={getStatusColor(stop.status)} variant="secondary">
                          {getStatusLabel(stop.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Return */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-sm">
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Retur til hjemmebase</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total jobs:</span>
                    <span className="font-medium">{routeData.totalJobs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimeret kørsel:</span>
                    <span className="font-medium">{routeData.totalKm} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimeret tid:</span>
                    <span className="font-medium">{formatMinutes(routeData.totalMinutes)}</span>
                  </div>
                  <Button
                    className="w-full mt-2"
                    variant="outline"
                    onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
                    data-testid="open-google-maps-btn"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Åbn i Google Maps
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Map */}
          <div className="lg:col-span-3">
            <Card className="h-full" data-testid="route-map-card">
              <CardContent className="p-0 h-full min-h-[500px]">
                <div ref={mapRef} className="w-full h-full min-h-[500px] rounded-lg" data-testid="route-map" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
