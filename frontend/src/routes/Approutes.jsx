import React from 'react'
import { createBrowserRouter , RouterProvider } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import UserAuth from '../auth/UserAuth'

const router = createBrowserRouter(
    [
        {
            path : '/',
            element: <UserAuth>
                 <Home />
            </UserAuth>
        },

        {
            path : '/login',
            element : <Login />
        },
        {
            path : '/register',
            element : <Register />
        },
        {
            path : '/project',
            element : <UserAuth>
                 <Project />
            </UserAuth>
        }

   ]
)


export default router
