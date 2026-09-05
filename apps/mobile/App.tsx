import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { configureApiClient } from '@suppsense/api-client';

import LoginScreen from './src/pages/login_screen';
import LogoutScreen from './src/pages/logout_screen';
import SignupScreen from './src/pages/signup_screen';
import BarcodeEntryManual from './src/pages/barcode_entry_manual';
import { getSession, getAccessToken } from './src/auth/session_storage';

configureApiClient(getAccessToken);

enum ActiveView {
    LOGIN,
    SIGNUP,
    MAINAPP,
}

// to be replaced later with the actual main application
function MainApp({ onLoggedOut }: { onLoggedOut: () => void }) {
    return (
        <View style={styles.container}>
            <BarcodeEntryManual />
            <LogoutScreen onLoggedOut={onLoggedOut} />
        </View>
    );
}

// runs by default to check if the user is logged in
// if they are logged in main app is rendered, if not login screen is rendered
export default function App() {
    const [activeView, setActiveView] = useState<ActiveView>('LOGIN');

    useEffect(() => {
        getSession().then((session) => { if(session !== null) { setActiveView('MAINAPP') } });
    }, []);

    if(activeView === 'LOGIN')
    {
        return <LoginScreen onLoginSuccess={() => setActiveView('MAINAPP')} onSignup={() => setActiveView('SIGNUP')} />;
    }
    else if(activeView === 'SIGNUP')
    {
        return <SignupScreen onSignupSuccess={() => setActiveView('EMAIL_CHALLENGE')} onSignupExit={() => setActiveView('LOGIN')}/>;
    }

    return <MainApp onLoggedOut={() => setActiveView('LOGIN')} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
  },
});