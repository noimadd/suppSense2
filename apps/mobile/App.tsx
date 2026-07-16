import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getSupplements } from '@suppsense/api-client';
import { Supplement } from '@suppsense/shared-types';

export default function App() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);

  useEffect(() => {
    getSupplements().then(setSupplements).catch(console.error);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {supplements.map(s => <Text key={s.id}>{s.id}</Text>)}
    </View>
  );
}