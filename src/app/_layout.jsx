import "../global.css";
import { Slot, Stack, Tabs } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{headerShown: false}}/>
      
    </Stack>
  );
}
