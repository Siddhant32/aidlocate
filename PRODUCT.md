# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People in public places who need to find first aid quickly.

## Product Purpose

AidLocate helps people locate first-aid kits, nearby medical facilities, and emergency support. The primary success outcome is helping someone find a publicly available first-aid kit near them.

## Positioning

AidLocate brings first-aid kit discovery, medical-facility lookup, QR identification, and emergency support into one public-safety web app.

## Operating Context

People may use the app on a phone while away from home and under time pressure. Location access is optional and requires browser permission; manual search remains available.

## Capabilities and Constraints

- The app includes a first-aid kit finder and interactive map, nearby hospital search, QR lookup, emergency SOS, trusted contacts, and live location sharing.
- Kit records currently in the app are sample data and are not verified real-world or publicly accessible locations. Never present them as confirmed available kits.
- Nearby medical facilities are retrieved from OpenStreetMap data. Map coverage and facility information may be incomplete.
- SOS delivery depends on configured notification providers; browser-only fallback data is not a production authentication or notification service.

## Brand Commitments

The product is named AidLocate and is positioned around public safety.

## Evidence on Hand

- Eight sample kit entries are in `src/data.js`; none are verified public-access kit records.
- Hospital search uses live OpenStreetMap/Photon results.
- Supabase and notification-provider configuration are deployment-dependent.

## Product Principles

- Help users reach the nearest useful next step quickly.
- Make location permission optional and explain manual alternatives.
- Distinguish verified information from sample or incomplete map data.
- Keep emergency limitations visible; never imply that the app replaces emergency services.
