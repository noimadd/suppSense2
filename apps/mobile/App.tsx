import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { configureApiClient } from '@suppsense/api-client';

import LoginScreen from './src/pages/login_screen';
import LogoutScreen from './src/pages/logout_screen';
import { getSession, getAccessToken } from './src/auth/session_storage';

configureApiClient(getAccessToken);

// to be replaced later with the actual main application
function MainApp({ onLoggedOut }: { onLoggedOut: () => void }) {
    return (
        <View style={styles.container}>
            <LogoutScreen onLoggedOut={onLoggedOut} />
        </View>
    );
}

// runs by default to check if the user is logged in
// if they are logged in main app is rendered, if not login screen is rendered
export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        getSession().then((session) => setIsLoggedIn(session !== null));
    }, []);

    if (isLoggedIn === null) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#4d45dd" />
            </View>
        );
    }

    if (!isLoggedIn) {
        return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
    }

    return <MainApp onLoggedOut={() => setIsLoggedIn(false)} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
  },
});