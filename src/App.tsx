import React, { useState } from 'react';
import Router from 'components/Router';
import { app } from "firebaseApp";
import { getAuth } from "firebase/auth";

function App() {
  
  const auth = getAuth(app);
  console.log(auth, "auth");

  const [ isAuthenticated, setIsAuthenticated ] = useState<boolean>(!!auth?.currentUser);


  return (
      <Router isAuthenticated={isAuthenticated}/>
  );
}

export default App;
