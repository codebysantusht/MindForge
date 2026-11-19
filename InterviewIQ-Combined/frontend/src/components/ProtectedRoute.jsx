
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('interviewiq-token');

  console.log('PROTECTED ROUTE CHECK');
  console.log('TOKEN EXISTS:', !!token);

  if (!token) {
    console.log('NO TOKEN - REDIRECTING TO LOGIN');
    return <Navigate to="/login" replace />;
  }

  console.log('TOKEN FOUND - ALLOWING DASHBOARD');

  return children;
}

export default ProtectedRoute;
