import axios from "axios";

// connecting to backend and creating the axios instances the baseURL is for the localhost of the backend 

const axiosInstance = axios.create({
    baseURL:import.meta.env.VITE_API_URL,

    headers : {
        "Authorization" : `Bearer ${localStorage.getItem('token')}` // it is used for middleware were the user must be login so the reason , we are accessing it from the local storage , and this request will work for every middleware request if user is logged in 
    }
})


export default axiosInstance; // exporting axiosInstance 



// {
//   data:      /* ← the response body (parsed JSON by default) */,
//   status:    /* HTTP status code (e.g. 200) */,
//   statusText,
//   headers,
//   config,
//   request
// }

// here res.data is answer that whatever server has sent back as body 

// where does the data come from 
// Node/Express example
// app.post('/users/login', (req, res) => {
//   // after checking credentials...
//   res.json({ token: 'abc123', user: { id: 1, email: req.body.email } });
// }); here server sends some res.json({}) if it is successfull 


// client side axios 
// axios.post('/users/login', { email, password })
//   .then(res => {
//     // res.data === { token: 'abc123', user: {...} }
//     console.log(res.data.token);      // "abc123"
//     console.log(res.data.user.email);
//   }); now this is sent to backend for the /users/login route and whatever server sends back as a body we can access it through res.data.id , res.data.email
