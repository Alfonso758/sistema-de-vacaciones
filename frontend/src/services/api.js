import axios from 'axios';


export default axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});


/*  
'https://api.vacaciones.sokodev.com/api'
'http://127.0.0.1:8000/api'
*/