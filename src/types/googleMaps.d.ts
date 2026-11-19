/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global Google Maps ambient definitions for seamless TypeScript compilation
declare namespace google {
  export namespace maps {
    export class Map {
      constructor(mapDiv: Element | null, opts?: any);
      setCenter(latLng: any): void;
      getCenter(): any;
      setZoom(zoom: number): void;
      getZoom(): number;
      panTo(latLng: any): void;
      fitBounds(bounds: any, padding?: any): void;
      setMapTypeId(type: string): void;
      addListener(eventName: string, handler: Function): any;
      setHeading(heading: number): void;
    }
    export class Marker {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setPosition(latLng: any): void;
      setIcon(icon: any): void;
      setTitle(title: string): void;
      setZIndex(index: number): void;
      addListener(eventName: string, handler: Function): any;
    }
    export class InfoWindow {
      constructor(opts?: any);
      open(opts?: any): void;
      close(): void;
      setContent(content: string | Element): void;
    }
    export class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    export class LatLngBounds {
      constructor(sw?: any, ne?: any);
      extend(latLng: any): void;
    }
    export class Circle {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setCenter(center: any): void;
      setRadius(radius: number): void;
    }
    export class Polyline {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setPath(path: any): void;
    }
    export class DirectionsService {
      route(request: any, callback: (result: any, status: any) => void): void;
    }
    export class DirectionsRenderer {
      constructor(opts?: any);
      setMap(map: Map | null): void;
      setDirections(directions: any): void;
    }
    export class StreetViewPanorama {
      constructor(container: Element | null, opts?: any);
      setPosition(latLng: any): void;
      setVisible(visible: boolean): void;
    }
    export enum TravelMode {
      WALKING = 'WALKING',
      DRIVING = 'DRIVING',
      TRANSIT = 'TRANSIT',
      BICYCLING = 'BICYCLING',
    }
    export enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain',
    }
    export namespace event {
      export function clearInstanceListeners(instance: any): void;
      export function addListener(instance: any, eventName: string, handler: Function): any;
    }
  }
}
