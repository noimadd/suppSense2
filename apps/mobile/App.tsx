import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { configureApiClient } from '@suppsense/api-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Main Screens
import BarcodeEntryScreen  from './src/pages/barcode_entry';
import LibrariesScreen from './src/pages/libraries_screen';

// Components
import TopBar from './src/pages/components/top_bar';
import SideMenu from './src/pages/components/side_menu';

// Auth
import LoginScreen from './src/pages/auth/login_screen';
import SignupScreen from './src/pages/auth/signup_screen';
import { getSession, getAccessToken } from './src/auth/session_storage';
import { handleLogout } from './src/auth/logout';
import { StoredSession } from './src/auth/auth';

configureApiClient(getAccessToken);

enum ActiveView {
    LOGIN = 'LOGIN',
    SIGNUP = 'SIGNUP',
    MAINAPP = 'MAINAPP',
}

enum MainView {
    BARCODE = 'BARCODE',
    LIBRARIES = 'LIBRARIES',
}

// to be replaced later with the actual main application
function MainApp({ session, onLoggedOut }: { session: StoredSession; onLoggedOut: () => void }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeView, setActiveView] = useState<MainView>(MainView.BARCODE);
    const [loggingOut, setLoggingOut] = useState(false);

    const menuItems = [
        { label: 'Supplement Lookup', onPress: () => setActiveView(MainView.BARCODE) },
        { label: 'Libraries', onPress: () => setActiveView(MainView.LIBRARIES) },
        {
            label: 'Log out',
            onPress: async () => {
                if (loggingOut) return;
                setLoggingOut(true);
                try {
                    await handleLogout();
                    onLoggedOut();
                } finally {
                    setLoggingOut(false);
                }
            },
        }
    ];

    return (
        <View style={styles.screen}>
            <TopBar onMenuPress={() => setDrawerOpen(true)} onProfilePress={() => {}} />

            <View style={styles.content}>
                {activeView === MainView.BARCODE && <BarcodeEntryScreen />}
                {activeView === MainView.LIBRARIES && (
                    <LibrariesScreen
                        session={session}
                        onExit={() => setActiveView(MainView.BARCODE)}
                        onViewLibrary={(library) => { /* TODO: wire up once library_screen  */ }}
                        onViewProduct={(productId) => { /* TODO: wire up product_display navigation */ }}
                        onAddProduct={(libraryId) => { /* TODO: wire up add-product */ }}
                    />
                )}
            </View>

            <SideMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} items={menuItems} />
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
    const [session, setSession] = useState<StoredSession | null>(null);

    useEffect(() => {
        getSession().then((storedSession) => {
            if (storedSession !== null) {
                setSession(storedSession);
                setActiveView(ActiveView.MAINAPP);
            }
        });
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

    if (session === null) {
        return <ActivityIndicator />;
    }

    return <MainApp session={session} onLoggedOut={() => setActiveView(ActiveView.LOGIN)} />;
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