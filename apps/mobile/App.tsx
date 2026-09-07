import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { configureApiClient } from '@suppsense/api-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Main Screens
import BarcodeEntryScreen  from './src/pages/barcode_entry';

// Components
import TopBar from './src/pages/components/top_bar';
import SideMenu from './src/pages/components/side_menu';

// Auth
import LoginScreen from './src/pages/auth/login_screen';
import LogoutScreen from './src/pages/auth/logout_screen';
import SignupScreen from './src/pages/auth/signup_screen';
import { getSession, getAccessToken } from './src/auth/session_storage';

configureApiClient(getAccessToken);

enum ActiveView {
    LOGIN = 'LOGIN',
    SIGNUP = 'SIGNUP',
    MAINAPP = 'MAINAPP',
}

// to be replaced later with the actual main application
function MainApp({ onLoggedOut }: { onLoggedOut: () => void }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <View style={styles.screen}>
            <TopBar onMenuPress={() => setDrawerOpen(true)} onProfilePress={() => {}} />

            <View style={styles.content}>
                <BarcodeEntryScreen />
                <LogoutScreen onLoggedOut={onLoggedOut} />
            </View>

            <SideMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </View>
    );
}
// runs by default to check if the user is logged in
// if they are logged in main app is rendered, if not login screen is rendered
export default function App() {
    return (
        <SafeAreaProvider>
            <AppContent />
        </SafeAreaProvider>
    );
}

function AppContent() {
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
  screen: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});