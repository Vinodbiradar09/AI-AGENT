import React from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './routes/Approutes'
import { UserProvider } from './context/user.context'

const App = () => {
  return (
    <div>

     <UserProvider>
        <RouterProvider router={router} />
     </UserProvider>
      
    </div>
  )
}

export default App
