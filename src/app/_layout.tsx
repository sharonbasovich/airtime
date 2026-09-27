import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PurchasesProvider } from '../purchases/PurchasesProvider';
import { RecordsProvider } from '../state/RecordsProvider';
import { C } from '../ui/theme';

export default function RootLayout() {
  return (
    <PurchasesProvider>
      <RecordsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.bg },
            headerTintColor: C.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: C.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="jump" options={{ title: 'Daily jump' }} />
          <Stack.Screen name="jumpoff" options={{ title: 'Jump-Off' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="sdk" options={{ title: 'RevenueCat' }} />
        </Stack>
      </RecordsProvider>
    </PurchasesProvider>
  );
}
