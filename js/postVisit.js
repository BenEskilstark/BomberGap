
import axios from 'axios';
const {config} = require('./config');
// const axios = require('axios');

// droplet
const axiosInstance = axios.create({
  baseURL: 'https://benhub.io/analytics',
});


const postVisit = (path, map) => {
  if (config.isLocalHost) return;

  const isUnique = !!!localStorage.getItem('isRevisit_' + path);
  localStorage.setItem('isRevisit_' + path, true);
  return axiosInstance
    .post('/visit', {
      hostname: 'midway', path, isUnique, map,
    })
};


const getHostname = () => {
  return window.location.hostname;
}

export default postVisit;
