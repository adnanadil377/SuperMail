import { useContext } from "react"
import AuthContext from "./AuthContext"

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    // This error handling helps catch if useAuth is used outside an AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;