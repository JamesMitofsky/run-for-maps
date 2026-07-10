import { Image, Linking, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOsmStatus } from "../auth/useOsmStatus";
import { useOsmUser } from "../auth/useOsmUser";
import { signOutOsm } from "../auth/osmAuth";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";

// Who you are on OSM, and the way out — a mirror of the web AccountCard. Sign-out
// clears the keychain token; the router auth gate then flips to the login screen.
export default function Profile() {
  const router = useRouter();
  const { status } = useOsmStatus();
  const user = useOsmUser();

  const openOsmProfile = () => {
    if (!user?.username) return;
    Linking.openURL(`https://www.openstreetmap.org/user/${encodeURIComponent(user.username)}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-ink">Profile</Text>
          <Button title="Done" variant="ghost" onPress={() => router.back()} />
        </View>

        <Panel>
          <View className="flex-row items-center gap-4">
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                className="h-16 w-16 rounded-full bg-paper-deep"
              />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-paper-deep">
                <Text className="text-xl font-bold text-ink-dim">
                  {(user?.username ?? "?").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="flex-1 text-lg font-bold text-ink" numberOfLines={1}>
                  {user?.username ?? (status?.loggedIn ? "Connected to OSM" : "Not connected")}
                </Text>
              </View>
              {status && !status.live ? (
                <Text className="mt-0.5 text-xs font-semibold text-amber-600">Sandbox</Text>
              ) : null}
            </View>
          </View>
        </Panel>

        {user ? (
          <Panel>
            <View className="flex-row items-center justify-between border-b border-paper-line py-2.5">
              <Text className="text-ink-dim">Lifetime changesets</Text>
              <Text className="font-bold text-ink">{user.changesetCount}</Text>
            </View>
            {user.accountCreated ? (
              <View className="flex-row items-center justify-between py-2.5">
                <Text className="text-ink-dim">Member since</Text>
                <Text className="font-bold text-ink">
                  {new Date(user.accountCreated).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
          </Panel>
        ) : null}

        {user?.username ? (
          <Button title="View OSM profile" variant="secondary" onPress={openOsmProfile} />
        ) : null}

        <Button
          title="Sign out"
          variant="danger"
          onPress={async () => {
            await signOutOsm();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
