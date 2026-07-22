import { NativeTabs } from "expo-router/unstable-native-tabs";

const { Icon, Label } = NativeTabs.Trigger;

// SwiftUI-backed tab bar. On iOS 26 this renders as the floating Liquid Glass
// nav island automatically. `sf` drives iOS icons (SF Symbols), `md` drives the
// Android fallback (Material Symbols) — no native asset setup needed for either.
// Nearby is the landing tab.
export const unstable_settings = { initialRouteName: "quick-update" };

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="quick-update">
        <Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <Label>Nearby</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <Icon sf={{ default: "figure.run", selected: "figure.run" }} md="directions_run" />
        <Label>Verify</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
