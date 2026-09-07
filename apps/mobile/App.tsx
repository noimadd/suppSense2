import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { configureApiClient } from '@suppsense/api-client';

import LoginScreen from './src/pages/login_screen';
import LogoutScreen from './src/pages/logout_screen';
import SignupScreen from './src/pages/signup_screen';
import BarcodeEntryScreen  from './src/pages/barcode_entry';
import { getSession, getAccessToken } from './src/auth/session_storage';

configureApiClient(getAccessToken);

enum ActiveView {
    LOGIN = 'LOGIN',
    SIGNUP = 'SIGNUP',
    MAINAPP = 'MAINAPP',
}

// to be replaced later with the actual main application
function MainApp({ onLoggedOut }: { onLoggedOut: () => void }) {
    return (
        <View style={styles.container}>
            <BarcodeEntryScreen />
            <LogoutScreen onLoggedOut={onLoggedOut} />
        </View>
    );
}

// runs by default to check if the user is logged in
// if they are logged in main app is rendered, if not login screen is rendered
export default function App() {
    const [activeView, setActiveView] = useState<ActiveView>(ActiveView.LOGIN);

    useEffect(() => {
        getSession().then((session) => { if(session !== null) { setActiveView(ActiveView.MAINAPP) } });
    }, []);

    if(activeView === ActiveView.LOGIN)
    {
        return <LoginScreen onLoginSuccess={() => setActiveView(ActiveView.MAINAPP)} onSignup={() => setActiveView(ActiveView.SIGNUP)} />;
    }
    else if(activeView === ActiveView.SIGNUP)
    {
        // onSignupSuccess only fires once SignupScreen's internal email verification flow has completed,
        // so the user is verified and should log in - not routed to a separate challenge state.
        return <SignupScreen onSignupSuccess={() => setActiveView(ActiveView.LOGIN)} onSignupExit={() => setActiveView(ActiveView.LOGIN)}/>;
    }

    return <MainApp onLoggedOut={() => setActiveView(ActiveView.LOGIN)} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
  },
});