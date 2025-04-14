import { Link, Stack } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Page non trouvée" }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 20, color: '#2563eb' }}>
          Page non trouvée
        </Text>
        <Text style={{ marginBottom: 30, textAlign: 'center', color: '#666' }}>
          La page que vous recherchez n'existe pas ou une erreur s'est produite.
        </Text>
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={{ padding: 15, backgroundColor: '#2563eb', borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
} 