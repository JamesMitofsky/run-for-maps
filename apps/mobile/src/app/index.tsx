import { Redirect } from "expo-router";

// Signed-in entry point routes straight into the native tab bar (View tab).
export default function Index() {
  return <Redirect href="/quick-update" />;
}
