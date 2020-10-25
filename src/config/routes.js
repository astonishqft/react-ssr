// import React from 'react';
// import Home from 'pages/Home';
// import Login from 'pages/Login';

const routersConfig = [
  {
    path: '/',
    name: 'Home',
    exact: true,
    component: require('pages/Home').default,
  }, {
    path: '/login',
    name: 'Login',
    exact: true,
    component: require('pages/Login').default,
  },
];

export default routersConfig;
