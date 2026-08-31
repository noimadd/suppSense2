import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { configureApiClient } from '@suppsense/api-client';

import LoginScreen from './src/pages/login_screen';
import LogoutScreen from './src/pages/logout_screen';
import SignupScreen from './src/pages/signup_screen';
import LibrariesScreen from './src/pages/libraries_screen';
import LibraryScreen from './src/pages/library_screen';
import { getSession, getAccessToken } from './src/auth/session_storage';
import { StoredSession } from '../auth/auth';

configureApiClient(getAccessToken);

enum ActiveView {
    LOGIN,
    SIGNUP,
    MAINAPP,
    LIBRARIES,
    LIBRARY,
}

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
    const [activeView, setActiveView] = useState<ActiveView>('LOGIN');
    const [session, setSession] = useState<StoredSession>(null);

    const [activeLibrary, setActiveLibrary] = useState<ProductLibrary>(null);

    useEffect(() => {
        getSession().then((session_res) => {setSession(session_res)});
    }, []);
/*
    useEffect(() => {
        getSession().then((session) => { if(session !== null) { setActiveView('MAINAPP') } });
    }, []);
*/

    console.log("Render");

    if(activeView === 'LOGIN')
    {
        return <LoginScreen onLoginSuccess={() => setActiveView('MAINAPP')} onSignup={() => setActiveView('SIGNUP')} />;
    }
    else if(activeView === 'SIGNUP')
    {
        return <SignupScreen onSignupSuccess={() => setActiveView('EMAIL_CHALLENGE')} onSignupExit={() => setActiveView('LOGIN')}/>;
    }
    else if(activeView === 'LIBRARY')
    {
        return <LibraryScreen session={session} libraryData={activeLibrary} onExit={() => setActiveView('MAINAPP')}
                    onViewProduct={(product_id) => { console.log(product_id) }} onAddProduct={(target_library_id) => console.log(target_library_id) }
                    />;
    }

    return <LibrariesScreen session={session} onExit={() => setActiveView('MAINAPP')}
                onViewLibrary={(library) => { setActiveLibrary(library); setActiveView('LIBRARY') }}
                onViewProduct={(product_id) => { console.log(product_id) }}
                onAddProduct={(target_library_id) => { console.log(target_library_id)} }
            />;

    //return <MainApp onLoggedOut={() => setActiveView('LOGIN')} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f12',
  },
});