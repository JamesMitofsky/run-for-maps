import { Pressable, Text, View } from "react-native";
import { hapticSelect } from "../../ports/haptics";

// A row of mutually exclusive options rendered as one bordered control — the
// mobile mirror of the web SegmentedControl, plus the native selection tick.
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View className="border-paper-line flex-row overflow-hidden rounded-lg border">
      {options.map((o) => (
        <Pressable
          key={o.key}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o.key }}
          onPress={() => {
            if (o.key === value) return;
            hapticSelect();
            onChange(o.key);
          }}
          className={`flex-1 items-center justify-center px-1 py-2 ${
            value === o.key ? "bg-sky-deep" : "bg-paper/40"
          }`}
        >
          <Text
            className={`text-xs ${value === o.key ? "text-ink font-semibold" : "text-ink-dim"}`}
            numberOfLines={1}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
