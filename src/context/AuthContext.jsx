import {createContext, useState, useContext,useEffect} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({children}){
    const [token,setToken] = useState( 
        () => localStorage.getItem("sellerShieldToken")
    );

    const login = (newToken) => {
        localStorage.setItem("sellerShieldToken",newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("sellerShieldToken");
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{
            token,
            isAuthenticated: Boolean(token),
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(){
    return useContext(AuthContext);
}