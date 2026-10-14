import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Scope, ModuleKey, ViewState, Site } from '../types';
import { CURRENT_ORGANIZATION, SITES_DATA, DEMO_USERS } from '../data/mockData';

interface AppContextType {
  user: User | null;
  scope: Scope;
  permittedSites: Site[];
  activeModule: ModuleKey;
  viewState: ViewState;
  sidebarCollapsed: boolean;
  isScopeModalOpen: boolean;
  isScopeSwitching: boolean;
  notificationMessage: string | null;
  setActiveModule: (mod: ModuleKey) => void;
  setViewState: (state: ViewState) => void;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  setIsScopeModalOpen: (open: boolean) => void;
  switchSite: (siteId: string) => boolean;
  login: (username: string, password: string, preferredSiteId?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsDemoUser: (user: User, siteId?: string) => void;
  logout: () => void;
  showNotification: (msg: string) => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state: logged in with the chief executive for immediate evaluation,
  // but with full capability to log out and use the LoginView.
  const [user, setUser] = useState<User | null>(DEMO_USERS[0] ?? null);
  
  const [scope, setScope] = useState<Scope>(() => {
    const initialSite = SITES_DATA[0]!;
    return {
      orgId: CURRENT_ORGANIZATION.id,
      orgName: CURRENT_ORGANIZATION.name,
      siteId: initialSite.id,
      siteName: initialSite.name,
      siteCode: initialSite.code,
      siteType: initialSite.type,
    };
  });

  const [activeModule, setActiveModule] = useState<ModuleKey>('EXE');
  const [viewState, setViewState] = useState<ViewState>('normal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [isScopeModalOpen, setIsScopeModalOpen] = useState<boolean>(false);
  const [isScopeSwitching, setIsScopeSwitching] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Derived permitted sites based on user access
  const permittedSites = React.useMemo(() => {
    if (!user) return [];
    return SITES_DATA.filter(site => user.permittedSiteIds.includes(site.id));
  }, [user]);

  // Ensure current scope is permitted when user changes
  useEffect(() => {
    if (user && permittedSites.length > 0) {
      if (!scope.siteId || !user.permittedSiteIds.includes(scope.siteId)) {
        const fallbackSite = permittedSites[0]!;
        setScope({
          orgId: CURRENT_ORGANIZATION.id,
          orgName: CURRENT_ORGANIZATION.name,
          siteId: fallbackSite.id,
          siteName: fallbackSite.name,
          siteCode: fallbackSite.code,
          siteType: fallbackSite.type,
        });
      }
    }
  }, [user, permittedSites, scope.siteId]);

  const showNotification = (msg: string) => {
    setNotificationMessage(msg);
  };

  const clearNotification = () => {
    setNotificationMessage(null);
  };

  const switchSite = (siteId: string): boolean => {
    if (!user) return false;
    
    // Check permission
    if (!user.permittedSiteIds.includes(siteId)) {
      showNotification('خطای دسترسی: شما مجوز مشاهده این سایت بیمارستانی را ندارید.');
      return false;
    }

    const targetSite = SITES_DATA.find(s => s.id === siteId);
    if (!targetSite) return false;

    // Simulate safe transition and security re-validation as per FSD §2.4
    setIsScopeSwitching(true);
    
    setTimeout(() => {
      setScope({
        orgId: CURRENT_ORGANIZATION.id,
        orgName: CURRENT_ORGANIZATION.name,
        siteId: targetSite.id,
        siteName: targetSite.name,
        siteCode: targetSite.code,
        siteType: targetSite.type,
      });
      setIsScopeSwitching(false);
      showNotification(`دامنه کاری به «${targetSite.name}» تغییر یافت.`);
    }, 300);

    return true;
  };

  const login = async (username: string, password: string, preferredSiteId?: string) => {
    // Simulated credential check
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      return { success: false, message: 'لطفاً نام کاربری یا شماره پرسنلی را وارد کنید.' };
    }
    if (!cleanPassword) {
      return { success: false, message: 'لطفاً کلمه عبور را وارد کنید.' };
    }

    // Match against registered users by personnel ID or email
    const normalizedUsername = cleanUsername.toLowerCase();
    const matched = DEMO_USERS.find(
      u => u.personnelId.toLowerCase() === normalizedUsername || 
           u.email.toLowerCase() === normalizedUsername ||
           u.email.toLowerCase().split('@')[0] === normalizedUsername
    );

    // If username is fabricated or unknown, reject immediately with failure feedback
    if (!matched) {
      return { 
        success: false, 
        message: 'شناسه کاربری یا شماره پرسنلی واردشده در سامانه یافت نشد. لطفاً اطلاعات صحیح را وارد نمایید.' 
      };
    }

    // Verify password for the matched user
    const validPasswords = ['sbmu1405', '123456', matched.personnelId, '••••••••', 'password'];
    if (!validPasswords.includes(cleanPassword)) {
      return {
        success: false,
        message: 'کلمه عبور واردشده برای این حساب کاربری نادرست است.'
      };
    }

    const targetSiteId = preferredSiteId && matched.permittedSiteIds.includes(preferredSiteId)
      ? preferredSiteId
      : matched.permittedSiteIds[0];

    loginAsDemoUser(matched, targetSiteId);
    return { success: true };
  };

  const loginAsDemoUser = (demoUser: User, siteId?: string) => {
    setUser(demoUser);
    const chosenSiteId = siteId && demoUser.permittedSiteIds.includes(siteId) 
      ? siteId 
      : demoUser.permittedSiteIds[0];

    const targetSite = SITES_DATA.find(s => s.id === chosenSiteId) || SITES_DATA[0]!;
    
    setScope({
      orgId: CURRENT_ORGANIZATION.id,
      orgName: CURRENT_ORGANIZATION.name,
      siteId: targetSite.id,
      siteName: targetSite.name,
      siteCode: targetSite.code,
      siteType: targetSite.type,
    });
    setViewState('normal');
    showNotification(`ورود موفق به سامانه با هویت «${demoUser.name}»`);
  };

  const logout = () => {
    setUser(null);
    setViewState('normal');
    showNotification('خروج از سامانه انجام شد.');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        scope,
        permittedSites,
        activeModule,
        viewState,
        sidebarCollapsed,
        isScopeModalOpen,
        isScopeSwitching,
        notificationMessage,
        setActiveModule,
        setViewState,
        setSidebarCollapsed,
        setIsScopeModalOpen,
        switchSite,
        login,
        loginAsDemoUser,
        logout,
        showNotification,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
